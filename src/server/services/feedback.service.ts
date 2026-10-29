import { Logger } from "shared/common/logger"
import { Module, Service, type OnStart } from "@typetorch/framework"
import { t } from "@rbxts/t"
import { TextService } from "@rbxts/services"
import { network } from "shared/net"
import { GetFeedbackResponse, IFeedbackItem, HttpService } from "./http.service"

const descriptionValidator = t.intersection(
	t.string,
	(value: unknown): value is string =>
		typeIs(value, "string") && value.size() >= 10 && value.size() <= 1000
)

interface CacheEntry {
	data: GetFeedbackResponse
	expiresAt: number
}

@Service()
export class FeedbackService extends Module implements OnStart {
	private readonly logger = new Logger("feedback.service")
	constructor(private httpService: HttpService) {
		super()
	}

	private readonly MAX_PENDING = 10
	private readonly CACHE_TTL = 60
	private cache = new Map<number, CacheEntry>()

	private async getCachedFeedbacks(userId: number) {
		const now = os.clock()
		const cached = this.cache.get(userId)
		if (cached && cached.expiresAt > now) {
			return cached.data
		}
		const result = await this.httpService.getPlayerFeedbacks(userId)
		this.cache.set(userId, { data: result, expiresAt: now + this.CACHE_TTL })
		return result
	}

	private invalidateCache(userId: number) {
		this.cache.delete(userId)
	}

	private filterText(text: string, fromUserId: number): string {
		const [ok, result] = pcall(() => TextService.FilterStringAsync(text, fromUserId))
		if (!ok || !result) return text
		const [ok2, filtered] = pcall(() => (result as TextFilterResult).GetNonChatStringForBroadcastAsync())
		if (!ok2 || !filtered) return text
		return filtered as string
	}

	onStart() {
		this.trove.add(network.server.FeedbackService.submitFeedback.handle(
			async (player, description) => {
				if (!descriptionValidator(description)) {
					return [false, "Feedback must be between 10 and 1000 characters"]
				}

				// Fetch existing feedbacks to enforce pending limit
				const existing = await this.getCachedFeedbacks(player.UserId).catch(() => undefined)
				if (existing) {
					const mine = existing.feedback.filter((f) => f.user_id === player.UserId)
					const pendingCount = mine.filter((f) => f.status === "pending").size()
					if (pendingCount >= this.MAX_PENDING) {
						return [
							false,
							`You already have ${pendingCount} pending feedback(s). Wait for them to be reviewed before submitting more.`,
						]
					}
				}

				const result = await this.httpService
					.submitFeedback(player.UserId, description)
					.catch((err) => {
						this.logger.warn(
							`Failed to submit feedback for player ${player.UserId}: ${err}`
						)
						return undefined
					})
				if (!result) {
					return [false, "Failed to submit feedback"]
				}
				this.invalidateCache(player.UserId)
				return [result.feedback]
			}
		))

		this.trove.add(network.server.FeedbackService.getMyFeedbacks.handle(async (player) => {
			const result = await this.getCachedFeedbacks(player.UserId).catch((err) => {
				this.logger.warn(
					`Failed to fetch feedbacks for player ${player.UserId}: ${err}`
				)
				return undefined
			})
			if (!result) {
				return [false, "Failed to load feedback"]
			}
			const mine = result.feedback.filter((f) => f.user_id === player.UserId)
			const filtered: IFeedbackItem[] = mine.map((f) => ({
				...f,
				description: this.filterText(f.description, f.user_id),
				response: f.response !== undefined ? this.filterText(f.response, 0) : undefined,
			}))
			return [filtered]
		}))
	}
}
