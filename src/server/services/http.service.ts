import { fetch, Request } from "@rbxts/fetch-patched"
import { Players } from "@rbxts/services"
import { Module, Service, TypeTorch, type OnInit, type OnStop, type PlayerState } from "@typetorch/framework"
import { Logger } from "shared/common/logger"

interface SessionPayload {
	uuid: string
	user_id: number
	server_version: string
	joined_at: number
	left_at: number
	playtime: number
	leave_x: number
	leave_y: number
	leave_z: number
	last_collected_checkpoint: number
}

/** An open play session; plain data in playerState, so a swap keeps it open (and doesn't open a second one). */
interface Session {
	uuid: string
	/** os.clock() at join, for playtime */
	joinClock: number
	/** os.time() at join, for joined_at */
	joinTime: number
}

@Service()
export class HttpService extends Module implements OnInit, OnStop {
	private readonly logger = new Logger("http.service")
	private readonly HttpService = game.GetService("HttpService")
	private readonly host = "https://api.cart-game.project.phasenull.dev"
	private sessions!: PlayerState<Session | undefined>
	/** Leaves not sent yet: persisted, so a swap doesn't drop them. */
	private leave_queue!: SessionPayload[]
	private swapping = false

	onInit() {
		this.sessions = this.ctx.playerState<Session | undefined>("http.sessions.v1", () => undefined)
		this.leave_queue = this.ctx.persist<SessionPayload[]>("http.leaveQueue.v1", () => [])
		this.trove.add(TypeTorch.onSwapOut(() => (this.swapping = true)))
		// Leaves a swap interrupted before they were sent.
		if (this.leave_queue.size() > 0) this.trove.add(task.spawn(() => this.flushLeaveQueueSync()))
	}

	/** Server shutdown only (a swap runs onSwapOut first): flush any sessions still open, as the old BindToClose did. */
	onStop() {
		if (this.swapping) return
		for (const player of Players.GetPlayers()) {
			if (this.sessions.get(player)) this.enqueueLeave(player, 0)
		}
		this.flushLeaveQueueSync()
	}

	sessionJoin(player: Player) {
		if (this.sessions.get(player)) return // already open: this is the join replay after a swap
		this.sessions.set(player, {
			uuid: this.HttpService.GenerateGUID(false).lower(),
			joinClock: os.clock(),
			joinTime: os.time(),
		})
	}

	sessionLeave(player: Player, last_checkpoint: number) {
		this.enqueueLeave(player, last_checkpoint)
		this.trove.add(task.spawn(() => this.flushLeaveQueueSync()))
	}

	private enqueueLeave(player: Player, last_checkpoint: number) {
		const session = this.sessions.get(player)
		if (!session) return
		const joined_at = session.joinTime * 1000
		const playtime = math.floor(os.clock() - session.joinClock)
		const left_at = math.floor(os.time()) * 1000
		const char = player.Character
		const pos = char?.PrimaryPart?.Position ?? char?.FindFirstChildWhichIsA("BasePart")?.Position
		this.sessions.delete(player)
		this.leave_queue.push({
			uuid: session.uuid,
			user_id: player.UserId,
			server_version: tostring(game.PlaceVersion),
			joined_at,
			left_at,
			playtime,
			leave_x: math.floor(pos?.X ?? 0),
			leave_y: math.floor(pos?.Y ?? 0),
			leave_z: math.floor(pos?.Z ?? 0),
			last_collected_checkpoint: last_checkpoint,
		})
	}

	private flushLeaveQueueSync() {
		const payloads = [...this.leave_queue]
		this.leave_queue.clear()
		this.logger.log(`Flushing ${payloads.size()} session leave(s)`)
		const api_key = this.HttpService.GetSecret("API_KEY")
		for (const payload of payloads) {
			const body = this.HttpService.JSONEncode(payload)
			this.logger.log(`Sending session leave for user ${payload.user_id}: ${body}`)
			const [ok, result] = pcall(() =>
				this.HttpService.RequestAsync({
					Url: `${this.host}/sessions/leave`,
					Method: "POST",
					Headers: {
						"Content-Type": "application/json",
						Authorization: api_key.AddPrefix("Bearer "),
					},
					Body: body,
				})
			)
			if (!ok) {
				this.logger.warn(`Request failed for user ${payload.user_id}: ${result}`)
			} else {
				this.logger.log(`Response for user ${payload.user_id}: status=${result.StatusCode} body=${result.Body}`)
			}
		}
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
