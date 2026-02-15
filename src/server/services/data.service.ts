import { Dependency, OnStart, Service } from "@flamework/core";
import ProfileService from "@rbxts/profileservice";
import { Profile } from "@rbxts/profileservice/globals";
import {
	DataStoreService,
	MarketplaceService,
	Players,
	ReplicatedStorage,
	RunService,
	Workspace,
} from "@rbxts/services";
import Signal from "@rbxts/signal";
import { Logger } from "shared/logger";
import { ServerEvents, ServerFunctions } from "shared/network.helper";
const PROFILE_TEMPLATE = {
	gamepasses: [] as number[],
	cash: 0,
	playtime: 0,
	revives: 999,
	flips: 999,
	collected_checkpoints: [0] as number[],
	inventory: {
		vehicles: ["Cart"]  // Default cart for all players
	} as Record<string, string[]>,
	customization: {} as Record<string, string[]>,
};
type PurchaseHistoryEntry = {
	purchase_type: "robux" | "cash";
	price: number;
	product_name: string;
	product_type: "item" | "case" | "gamepass";
	created_at: number;
};
const PROFILE_STORE = ProfileService.GetProfileStore("players", PROFILE_TEMPLATE);

@Service({ loadOrder: 0 })
export class DataService implements OnStart {
	private state = new Map<number, Profile<typeof PROFILE_TEMPLATE>>();
	private playtime_state = new Map<number, number>();
	constructor(private logger: Logger) {}

	public player_listeners = new Map<number, Signal<() => void>>();
	public subscribePlayerDataLoaded(player: Player) {
		let listener = this.player_listeners.get(player.UserId);
		if (!listener) {
			listener = new Signal<() => void>();
			this.player_listeners.set(player.UserId, listener);
		}
		return listener;
	}
	public onStart(): void {
		Players.PlayerAdded.Connect((player) => this.playerAdded(player));
		Players.PlayerRemoving.Connect((player) => this.playerRemoving(player));
		game.BindToClose(() => {
			for (const player of Players.GetPlayers()) {
				this.playerRemoving(player);
			}
		});
		
		// Setup network callbacks
		ServerFunctions.DataService.getCash.setCallback((player) => {
			const profile = this.getProfile(player);
			if (!profile) {
				return [false, "Profile not loaded"];
			}
			return [profile.Data.cash as number];
		});
		// ServerFunctions.getDailyRewardData.setCallback((player) => {
		// 	const profile = this.getProfile(player);
		// 	const data = profile?.Data.daily_reward;
		// 	return [
		// 		{
		// 			last_claimed_at: data?.last_claimed_at || 0,
		// 			last_claimed_index: data?.day_index || -1,
		// 			reward_list: getConfig().daily_rewards || [],
		// 		},
		// 	];
		// });
		// this.logger.log("DataService started and listening to player events");

		// while (true) {
		// 	const board = Workspace.FindFirstChild("KillsBoard")?.FindFirstChild("leaderboard") as ScreenGui;
		// 	const playtime_board = Workspace.FindFirstChild("PlaytimeBoard")?.FindFirstChild(
		// 		"leaderboard",
		// 	) as ScreenGui;
		// 	if (!board) continue;
		// 	this.refreshLeaderboard(board, "kills");
		// 	this.refreshLeaderboard(playtime_board, "playtime");
		// 	task.wait(30);
		// }
	}

	public grantPlayerCash(player: Player, amount: number, reason?: string, skipQuestProgress?: boolean) {
		const profile = this.getProfile(player);
		if (!profile) {
			this.logger.warn(`Tried to grant cash to player ${player.Name} but their profile was not loaded`);
			return;
		}
		const current = profile.Data.cash as number;
		profile.Data.cash = (current + amount) as any;
		this.logger.log(`Granted ${amount} cash to player ${player.Name}. Reason: ${reason || "N/A"}`);
		
		// Fire network event to update UI
		ServerEvents.DataService.updatePlayerCash.fire(player, profile.Data.cash as number);
		
		if (amount > 0) {
			ServerEvents.NotificationService.sendNotification(player, {
				title: "<b>Cash Earned!</b>",
				description: `<font color='#00FF00'>+$${amount}</font>${reason ? ` - ${reason}` : ""}`,
				duration: 4
			});
		}
		return profile.Data.cash as number
	}
	public refreshLeaderboard(leaderboard: ScreenGui, stat: string) {
	}
	public list100ByStat() {
	}

	public playerAdded(player: Player) {
		const profile = PROFILE_STORE.LoadProfileAsync(`${player.UserId}`);
		if (profile === undefined) {
			player.Kick("Could not load your data!");
			return;
		}
		profile.Reconcile();
		profile.ListenToRelease(() => {
			this.state.delete(player.UserId);
			player.Kick("Your data was unloaded!");
		});
		if (RunService.IsStudio()) {
			// this.logger.log(
			// 	"[STUDIO] Profile loaded for player " + player.Name + ", total playtime: " + profile.Data.playtime,
			// );
		}
		this.state.set(player.UserId, profile);
		this.playtime_state.set(player.UserId, os.clock());
		const listener = this.player_listeners.get(player.UserId);
		if (listener) {
			listener.Fire();
		}
		
		// Send initial cash to client
		task.delay(0.5, () => {
			ServerEvents.DataService.updatePlayerCash.fire(player, profile.Data.cash as number);
		});
	}
	// cash, kills, playtime, bounties

	public changeOrderedStat(player: Player, stat: keyof typeof PROFILE_TEMPLATE, amount: number) {
		const profile = this.state.get(player.UserId);
		if (!profile) return;
		if (!(stat in PROFILE_TEMPLATE)) return;
		const current = profile.Data[stat] as number;
		if (current === undefined) return;
		(profile.Data[stat] as number) = (current + amount) as any;
	}
	public playerRemoving(player: Player) {
		const profile = this.state.get(player.UserId);
		if (!profile) return;
		const join_time = this.playtime_state.get(player.UserId) ?? os.clock();
		const session_playtime = math.floor(os.clock() - join_time);
		profile.Data.playtime = (profile.Data.playtime as number) + session_playtime;
		this.playtime_state.delete(player.UserId);
		// Update ordered stats
		profile.Release();
		this.state.delete(player.UserId);
		this.playtime_state.delete(player.UserId);
		this.logger.log(`Saved data for player ${player.Name} (${player.UserId})`);
	}
	public getProfile(player: Player) {
		return this.state.get(player.UserId);
	}
}