import { OnStart, Service } from "@flamework/core"
import { fetch, Request } from "@rbxts/fetch-patched"
import { Logger } from "@common/shared/logger"
import { Players } from "@rbxts/services"

interface SessionLeavePayload {
	uuid: string
	left_at: number
	playtime: number
	leave_x: number
	leave_y: number
	leave_z: number
	last_collected_checkpoint: number
}

@Service()
export class HttpService implements OnStart {
	constructor(private logger: Logger) {}
	private readonly HttpService = game.GetService("HttpService")
	private readonly host = "https://api.cart-game.project.phasenull.dev"
	private readonly session_uuids = new Map<number, string>()
	private readonly session_join_times = new Map<number, number>()
	private readonly leave_queue: SessionLeavePayload[] = []

	onStart() {
		game.BindToClose(() => {
			// Flush any sessions still open (e.g. server shutdown before PlayerRemoving)
			for (const [user_id] of this.session_uuids) {
				const player = Players.GetPlayerByUserId(user_id)
				if (player) {
					this.enqueueLeave(player, 0)
				}
			}
			this.flushLeaveQueue().await()
		})
	}

	sessionJoin(player: Player) {
		const uuid = this.HttpService.GenerateGUID(false).lower()
		const now = math.floor(os.time())
		this.session_uuids.set(player.UserId, uuid)
		this.session_join_times.set(player.UserId, os.clock())
		task.spawn(async () => {
			const [ok, err] = pcall(() =>
				this.request<{ success: boolean }>(`/sessions/join`, {
					method: "POST",
					body: this.HttpService.JSONEncode({
						uuid,
						user_id: player.UserId,
						server_version: tostring(game.PlaceVersion),
						joined_at: now,
					}),
				} as unknown as Request).await()
			)
			if (!ok) this.logger.warn(`Failed to send session join for ${player.Name}: ${err}`)
		})
	}

	sessionLeave(player: Player, last_checkpoint: number) {
		this.enqueueLeave(player, last_checkpoint)
	}

	private enqueueLeave(player: Player, last_checkpoint: number) {
		const uuid = this.session_uuids.get(player.UserId)
		if (!uuid) return
		const join_clock = this.session_join_times.get(player.UserId) ?? os.clock()
		const playtime = math.floor(os.clock() - join_clock)
		const left_at = math.floor(os.time())
		const char = player.Character
		const pos = char?.PrimaryPart?.Position ?? char?.FindFirstChildWhichIsA("BasePart")?.Position
		this.session_uuids.delete(player.UserId)
		this.session_join_times.delete(player.UserId)
		this.leave_queue.push({
			uuid,
			left_at,
			playtime,
			leave_x: math.floor(pos?.X ?? 0),
			leave_y: math.floor(pos?.Y ?? 0),
			leave_z: math.floor(pos?.Z ?? 0),
			last_collected_checkpoint: last_checkpoint,
		})
	}

	private flushLeaveQueue(): Promise<void> {
		const payloads = [...this.leave_queue]
		this.leave_queue.clear()
		if (payloads.size() === 0) return Promise.resolve()
		const pending = payloads.map((payload) =>
			new Promise<void>((resolve) => {
				const [ok, err] = pcall(() =>
					this.request<{ success: boolean }>(`/sessions/leave`, {
						method: "POST",
						body: this.HttpService.JSONEncode(payload),
					} as unknown as Request).await()
				)
				if (!ok) this.logger.warn(`Failed to send session leave: ${err}`)
				resolve()
			})
		)
		return Promise.all(pending).then(() => {})
	}

	async getUser(user_id: number) {
		return await this.request<GetPlayerResponse>(
			`/leaderboard/get-player?user_id=${user_id}`
		)
	}
	async getLeaderboard() {
		return await this.request<LeaderBoardResponse>(`/leaderboard/list`)
	}
	syncPlayer(data: PostPlayerRequest) {
		this.updatePlayer(data).catch((err) => {
			this.logger.warn(`Failed to sync player ${data.user_id} to leaderboard: ${err}`)
		})
	}
	async submitFeedback(user_id: number, description: string) {
		return await this.request<PostFeedbackResponse>(`/feedback`, {
			method: "POST",
			body: this.HttpService.JSONEncode({ user_id, description }),
		} as unknown as Request)
	}
	async getPlayerFeedbacks(user_id: number) {
		return await this.request<GetFeedbackResponse>(`/feedback?limit=20&offset=0`)
	}
	private async updatePlayer(body: PostPlayerRequest) {
		return await this.request<PostPlayerResponse>(`/leaderboard/update-player`, {
			method: "POST",
			body: this.HttpService.JSONEncode(body),
		} as unknown as Request)
	}
	private async request<T>(endpoint: string, options?: Request): Promise<T> {
		const api_key = this.HttpService.GetSecret("API_KEY")
		const response = await fetch(`${this.host}${endpoint}`, {
			...options,
			headers: {
				...(options?.headers || {}),
				"Content-Type": "application/json",
				Authorization: api_key.AddPrefix("Bearer ")
			}
		} as unknown as Request)
		const data = (await response.json()) as { error: string } & T
		const http2 = game.GetService("HttpService")
		if (!response.ok || data.error) {
			throw `HTTP error! status: ${response.status}, message: ${http2.JSONEncode(data.error) || "Unknown error"}`
		}
		return data as T
	}
}

interface GetPlayerResponse {
	player: {
		user_id: number
		created_at: string
		updated_at: string
		cash: number
		playtime: number
		robux_spent: number
	}
	ranks: {
		cash: number
		playtime: number
		robux_spent: number
	}
}
interface PostPlayerResponse {
	success: true
}
interface PostPlayerRequest {
	user_id: number
	cash: number
	playtime: number
	robux_spent: number
}
export interface IFeedbackItem {
	id: number
	user_id: number
	description: string
	status: "pending" | "rejected" | "approved"
	response: string | undefined
	responded_at: number | undefined
	deleted_at: number | undefined
	created_at: number
}
interface PostFeedbackResponse {
	success: boolean
	feedback: IFeedbackItem
}
export interface GetFeedbackResponse {
	feedback: IFeedbackItem[]
	total: number
}
interface LeaderBoardResponse {
	cash: [
		{
			user_id: number
			cash: number
		}[]
	]
	playtime: [
		{
			user_id: number
			playtime: number
		}[]
	]
	robux_spent: [
		{
			user_id: number
			robux_spent: number
		}[]
	]
}
