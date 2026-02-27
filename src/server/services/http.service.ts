import { OnStart, Service } from "@flamework/core"
import { fetch, Request } from "@rbxts/fetch-patched"
import { Logger } from "@common/shared/logger"


@Service()
export class HttpService {
	constructor(private logger: Logger) {}
	private readonly HttpService = game.GetService("HttpService")
	private readonly host = "https://api.cart-game.project.phasenull.dev"




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
