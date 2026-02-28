import { Logger } from "@common/shared/logger"
import { BaseDataService } from "@common/server/base-data.service"
import { Dependency, OnStart, Service } from "@flamework/core"
import { Profile } from "@rbxts/profileservice/globals"
import { ServerEvents, ServerFunctions } from "shared/network.helper"
import { HttpService } from "./http.service"

const PROFILE_TEMPLATE = {
	gamepasses: [] as number[],
	cash: 0,
	playtime: 0,
	robux_spent: 0,
	revives: 0,
	flips: 1,
	collected_checkpoints: [0] as number[],
	inventory: {
		vehicles: ["Cart"],
		honk: ["Quack"],
	} as Record<string, string[]>,
	customization: {
		honk: ["Quack"],
	} as Record<string, string[]>,
}

export type PlayerProfile = Profile<typeof PROFILE_TEMPLATE>

@Service({ loadOrder: 0 })
export class DataService extends BaseDataService<typeof PROFILE_TEMPLATE> implements OnStart {
	protected readonly TEMPLATE = PROFILE_TEMPLATE
	protected readonly STORE_NAME = "players_2"

	constructor(logger: Logger) {
		super(logger)
	}

	// ─── Lifecycle ────────────────────────────────────────────────────────────

	public onStart(): void {
		this.init()

		ServerFunctions.DataService.getCash.setCallback((player) => {
			const profile = this.getProfile(player)
			if (!profile) return [false, "Profile not loaded"]
			return [profile.Data.cash]
		})
	}

	protected onPlayerAdded(player: Player, profile: PlayerProfile): void {
		Dependency<HttpService>().syncPlayer({
			user_id: player.UserId,
			cash: profile.Data.cash,
			playtime: profile.Data.playtime,
			robux_spent: profile.Data.robux_spent,
		})
		task.delay(0.5, () => {
			ServerEvents.DataService.updatePlayerCash.fire(player, profile.Data.cash)
		})
	}

	protected onPlayerRemoving(player: Player, profile: PlayerProfile): void {
		Dependency<HttpService>().syncPlayer({
			user_id: player.UserId,
			cash: profile.Data.cash,
			playtime: profile.Data.playtime,
			robux_spent: profile.Data.robux_spent,
		})
	}

	// ─── Cash ─────────────────────────────────────────────────────────────────

	public grantPlayerCash(
		player: Player,
		amount: number,
		reason?: string,
		_skipQuestProgress?: boolean,
		silent = false,
	): number | undefined {
		const profile = this.getProfile(player)
		if (!profile) {
			this.logger.warn(`Tried to grant cash to ${player.Name} but profile not loaded`)
			return undefined
		}
		profile.Data.cash += amount
		this.logger.log(`Granted ${amount} cash to ${player.Name}. Reason: ${reason ?? "N/A"}`)
		ServerEvents.DataService.updatePlayerCash.fire(player, profile.Data.cash)
		if (amount > 0 && !silent) {
			ServerEvents.NotificationService.sendNotification(player, {
				title: "<b>Cash Earned</b>",
				description: `<font color='#00FF00'>+$${amount}</font>${reason ? ` - ${reason}` : ""}`,
				duration: 10,
			})
		}
		return profile.Data.cash
	}
}
