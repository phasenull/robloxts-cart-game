import { Logger } from "@common/shared/logger"
import { OnStart, Service } from "@flamework/core"
import { t } from "@rbxts/t"
import { ServerFunctions } from "shared/network.helper"
import { HttpService } from "./http.service"

const descriptionValidator = t.intersection(
	t.string,
	(value: unknown): value is string =>
		typeIs(value, "string") && value.size() >= 10 && value.size() <= 1000
)

@Service()
export class FeedbackService implements OnStart {
	constructor(
		private logger: Logger,
		private httpService: HttpService
	) {}

	private readonly MAX_PENDING = 10

	onStart() {
		ServerFunctions.FeedbackService.submitFeedback.setCallback(
			async (player, description) => {
				if (!descriptionValidator(description)) {
					return [false, "Feedback must be between 10 and 1000 characters"]
				}

				// Fetch existing feedbacks to enforce pending limit
				const existing = await this.httpService
					.getPlayerFeedbacks(player.UserId)
					.catch(() => undefined)
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
				return [result.feedback]
			}
		)

		ServerFunctions.FeedbackService.getMyFeedbacks.setCallback(async (player) => {
			const result = await this.httpService
				.getPlayerFeedbacks(player.UserId)
				.catch((err) => {
					this.logger.warn(
						`Failed to fetch feedbacks for player ${player.UserId}: ${err}`
					)
					return undefined
				})
			if (!result) {
				return [false, "Failed to load feedback"]
			}
			const mine = result.feedback.filter((f) => f.user_id === player.UserId)
			return [mine]
		})
	}
}
