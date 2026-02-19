import { OnStart, Service } from "@flamework/core"
import { fetch, Request } from "@rbxts/fetch-patched"
import { Logger } from "shared/logger"

@Service()
export class HttpService implements OnStart {
	constructor(private logger: Logger) {}
	async onStart(): Promise<void> {
		const leaderboard = await this.getLeaderboard()
		print("Leaderboard:", leaderboard)
	}
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
	private async request<T>(endpoint: string, options?: Request): Promise<T> {
		const api_key = this.HttpService.GetSecret("API_KEY")
		print("api_Key:", api_key)
		const response = await fetch(`${this.host}${endpoint}`, {
			...options,
			headers: {
				...(options?.headers || {}),
				"Content-Type": "application/json",
				Authorization: api_key.AddPrefix("Bearer ")
			}
		} as unknown as Request)
		const data = (await response.json()) as { error: string } & T
		if (!response.ok || data.error) {
			throw `HTTP error! status: ${response.status}, message: ${data.error || "Unknown error"}`
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
