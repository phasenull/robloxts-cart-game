import { Players, ServerStorage, Workspace } from "@rbxts/services"
import Signal from "@rbxts/signal"
import type { Trove } from "@rbxts/trove"
import {
	Dependency,
	Module,
	Service,
	TypeTorch,
	type OnInit,
	type OnPlayerAdded,
	type OnStart,
	type OnStop,
	type PlayerState
} from "@typetorch/framework"
import { Logger } from "shared/common/logger"
import { network } from "shared/net"
import type { HttpService } from "./http.service"

const PROFILE_TEMPLATE = {
	gamepasses: [] as number[],
	cash: 0,
	playtime: 0,
	robux_spent: 0,
	revives: 1,
	flips: 5,
	collected_checkpoints: [0] as number[],
	inventory: {
		vehicles: ["Cart"],
		honk: ["Quack"],
	} as Record<string, string[]>,
	customization: {
		honk: ["Quack"],
	} as Record<string, string[]>,
}

export type PlayerData = typeof PROFILE_TEMPLATE

/** The live store name. Dev branches use `<name>_dev`, so they never touch prod data. */
const STORE_NAME = "players_2"

/** Saved together with Data on every save. MetaTagsLatest is what the last save wrote (see grantOnce). */
interface Tags {
	purchaseIds?: string[]
}

// The part of ProfileService's API this game uses. The library itself lives in the place
// (ServerStorage.Packages.ProfileService, required first by ServerScriptService.DataHost), not in the payload.
interface Profile<T> {
	Data: T
	MetaData: { MetaTags: Tags; MetaTagsLatest: Tags }
	IsActive(): boolean
	AddUserId(userId: number): void
	Reconcile(): void
	Save(): void
	Release(): void
	ListenToRelease(listener: () => void): { Disconnect(): void }
}
interface Store<T> {
	LoadProfileAsync(key: string, notReleasedHandler: "ForceLoad" | "Steal"): Profile<T> | undefined
}
interface ProfileServiceModule {
	// `this: void`: Luau calls it as ProfileService.GetProfileStore(...).
	GetProfileStore<T>(this: void, name: string, template: T): Store<T>
}

export type PlayerProfile = Profile<PlayerData>

/** The place's copy of ProfileService, once DataHost required it. Errors when the place lacks it; undefined in the cloud test. */
function profileService(): ProfileServiceModule | undefined {
	const module = ServerStorage.FindFirstChild("Packages")?.FindFirstChild("ProfileService")
	if (!module || !module.IsA("ModuleScript")) error("ServerStorage.Packages.ProfileService is missing (see the Player data guide)")
	if (Workspace.GetAttribute("TypeTorchTest") === true) return undefined // the cloud test: DataHost never runs there
	const deadline = os.clock() + 10
	while (module.GetAttribute("Warm") !== true) {
		if (os.clock() > deadline) error("ServerScriptService.DataHost didn't require ProfileService (see the Player data guide)")
		task.wait(0.1)
	}
	return require(module) as ProfileServiceModule
}

/** Lives in persist: the library, the store and one loaded profile per player for the whole server life. */
interface Sessions {
	library?: ProfileServiceModule
	store?: Store<PlayerData>
	profiles: Map<number, Profile<PlayerData>>
	/** Players whose profile is loading (a detached job). */
	loading: Set<number>
}

/**
 * Player data on ProfileService, swap-safe (Player data guide, option B): the library lives in the place, the loaded
 * profiles live in persist, a swap re-attaches instead of loading again, and every library call that writes (load,
 * save, release) runs with TypeTorch.runDetached so a deploy can't cut it off. Store name and profile key are the live
 * game's (`players_2`, `${UserId}`).
 */
@Service({ loadOrder: -10 })
export class DataService extends Module implements OnInit, OnStart, OnPlayerAdded, OnStop {
	private readonly logger = new Logger("data.service")
	private sessions!: Sessions
	/** os.clock() from which the player's playtime isn't counted into the profile yet. */
	private playtime!: PlayerState<{ since: number }>
	/** Fired once this generation attached the player's profile. */
	private readonly loaded = new Map<number, Signal<() => void>>()
	private swapping = false

	onInit() {
		this.sessions = this.ctx.persist<Sessions>("data.sessions.v1", () => ({ profiles: new Map(), loading: new Set() }))
		this.sessions.library ??= profileService()
		if (!this.sessions.store) {
			// The live store on prod, another one on dev branches.
			const name = TypeTorch.channel === "prod" ? STORE_NAME : `${STORE_NAME}_dev`
			this.sessions.store = this.sessions.library?.GetProfileStore(name, PROFILE_TEMPLATE)
		}
		this.playtime = this.ctx.playerState("data.playtime.v1", () => ({ since: os.clock() }))
		// A real leave (never a swap): count the playtime, report it, release the profile (ProfileService saves it).
		this.trove.connect(Players.PlayerRemoving, (player) => this.playerRemoving(player))
		this.trove.add(TypeTorch.onSwapOut(() => (this.swapping = true)))
	}

	onStart() {
		this.trove.add(
			network.server.DataService.getCash.handle((player) => {
				const profile = this.getProfile(player)
				if (!profile) return [false, "Profile not loaded"]
				return [profile.Data.cash]
			})
		)
	}

	onPlayerAdded(player: Player, playerTrove: Trove) {
		const sessions = this.sessions
		const store = sessions.store
		if (!store) return // only in the cloud test, where nobody joins
		const userId = player.UserId
		// Also runs for everyone already here after a swap: re-attach, or wait for the load that is still running.
		const fresh = !sessions.profiles.get(userId)?.IsActive() && !sessions.loading.has(userId)
		if (fresh) {
			sessions.loading.add(userId)
			this.detached(() => {
				try {
					const profile = store.LoadProfileAsync(`${userId}`, "ForceLoad")
					if (!profile) return
					if (player.Parent !== Players) {
						profile.Release()
						return
					}
					profile.AddUserId(userId)
					profile.Reconcile()
					sessions.profiles.set(userId, profile)
				} finally {
					sessions.loading.delete(userId)
				}
			})
		}
		while (sessions.loading.has(userId)) task.wait(0.1) // a swap ends this wait, not the load
		const profile = sessions.profiles.get(userId)
		if (!profile || !profile.IsActive()) {
			if (player.Parent === Players) player.Kick("Could not load your data!")
			return
		}
		// Released by another server (ForceLoad there): through the player trove, so a swap disconnects it.
		const connection = profile.ListenToRelease(() => {
			sessions.profiles.delete(userId)
			if (player.Parent === Players) player.Kick("Your data was unloaded!")
		})
		playerTrove.add(() => connection.Disconnect())

		this.playtime.get(player) // starts the clock on the first attach in this server
		this.loaded.get(userId)?.Fire()
		this.loaded.delete(userId)
		const http = Dependency<HttpService>()
		http.syncPlayer({
			user_id: userId,
			cash: profile.Data.cash,
			playtime: profile.Data.playtime,
			robux_spent: profile.Data.robux_spent,
		})
		http.sessionJoin(player) // keeps an open session across swaps
		playerTrove.add(task.delay(0.5, () => network.server.DataService.updatePlayerCash.fire(player, profile.Data.cash)))
	}

	/** Server shutdown (onSwapOut didn't run): what the old BindToClose did, minus the release ProfileService does itself. */
	onStop() {
		if (this.swapping) return
		for (const player of Players.GetPlayers()) {
			if (this.getProfile(player)) this.reportLeave(player)
		}
	}

	// ─── Public API ───────────────────────────────────────────────────────────

	/** The player's profile (the same handle in every generation), or undefined while it loads. */
	getProfile(player: Player): PlayerProfile | undefined {
		const profile = this.sessions.profiles.get(player.UserId)
		return profile?.IsActive() ? profile : undefined
	}

	/**
	 * A Signal that fires once this generation attached the player's profile. If the profile is already loaded it
	 * never fires: check getProfile() first.
	 */
	subscribePlayerDataLoaded(player: Player): Signal<() => void> {
		let signal = this.loaded.get(player.UserId)
		if (!signal) {
			signal = new Signal<() => void>()
			this.loaded.set(player.UserId, signal)
		}
		return signal
	}

	/** Asks ProfileService for a save now (a detached job: a deploy can't cut it off). */
	save(player: Player) {
		const profile = this.getProfile(player)
		if (profile) this.detached(() => profile.Save())
	}

	/** Increments a numeric field on the player's profile. No-op if the field isn't a number or the profile isn't loaded. */
	changeOrderedStat(player: Player, stat: keyof PlayerData, amount: number): void {
		const profile = this.getProfile(player)
		if (!profile) return
		const current = profile.Data[stat]
		if (typeOf(current) !== "number") return
		;(profile.Data[stat] as unknown as number) = (current as unknown as number) + amount
		this.logger.log(`Changed stat "${tostring(stat)}" for ${player.Name} by ${amount} → ${profile.Data[stat]}`)
	}

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
		network.server.DataService.updatePlayerCash.fire(player, profile.Data.cash)
		if (amount > 0 && !silent) {
			network.server.NotificationService.sendNotification.fire(player, {
				title: "<b>Cash Earned</b>",
				description: `<font color='#00FF00'>+$${amount}</font>${reason ? ` - ${reason}` : ""}`,
				duration: 10,
			})
		}
		return profile.Data.cash
	}

	/** Whether this receipt's grant is already recorded in the buyer's profile (saved or not yet). */
	wasGranted(receipt: ReceiptInfo): boolean {
		const profile = this.sessions.profiles.get(receipt.PlayerId)
		return profile?.MetaData.MetaTags.purchaseIds?.includes(receipt.PurchaseId) === true
	}

	/**
	 * Grants a developer product once. The PurchaseId goes into the profile's MetaTags together with the grant (the same
	 * save writes both), and the answer is PurchaseGranted only once MetaTagsLatest, the copy the last save wrote, holds
	 * it. A receipt Roblox sends again (after a swap, a crash, or on another server) finds the id and grants nothing.
	 */
	grantOnce(receipt: ReceiptInfo, grant: (data: PlayerData) => void): Enum.ProductPurchaseDecision {
		const profile = this.sessions.profiles.get(receipt.PlayerId)
		// Not in this server, or still loading: Roblox sends the receipt again later.
		if (!profile || !profile.IsActive()) return Enum.ProductPurchaseDecision.NotProcessedYet
		const tags = profile.MetaData.MetaTags
		const ids = tags.purchaseIds ?? []
		tags.purchaseIds = ids
		if (!ids.includes(receipt.PurchaseId)) {
			grant(profile.Data) // first: if it throws, nothing is recorded
			ids.push(receipt.PurchaseId)
			if (ids.size() > 100) ids.shift()
		}
		let nextSave = 0
		for (;;) {
			if (profile.MetaData.MetaTagsLatest.purchaseIds?.includes(receipt.PurchaseId) === true) {
				return Enum.ProductPurchaseDecision.PurchaseGranted
			}
			// Released before a save held it: the id was saved with the grant, or lost with it. Roblox sends it again.
			if (!profile.IsActive()) return Enum.ProductPurchaseDecision.NotProcessedYet
			if (os.clock() >= nextSave) {
				nextSave = os.clock() + 10
				this.detached(() => profile.Save()) // sooner than the 30 s autosave
			}
			task.wait(0.5)
		}
	}

	// ─── Leaves ───────────────────────────────────────────────────────────────

	private playerRemoving(player: Player) {
		const profile = this.sessions.profiles.get(player.UserId)
		if (!profile) return // still loading: that job sees the player left and releases it
		if (profile.IsActive()) this.reportLeave(player)
		this.sessions.profiles.delete(player.UserId)
		this.detached(() => profile.Release())
		this.logger.log(`Saved data for player ${player.Name} (${player.UserId})`)
	}

	/** Counts the playtime into the profile and reports the leave to the game's API (idempotent per moment). */
	private reportLeave(player: Player) {
		const profile = this.getProfile(player)
		if (!profile) return
		const clock = this.playtime.get(player)
		const seconds = math.floor(os.clock() - clock.since)
		profile.Data.playtime += seconds
		clock.since += seconds
		const http = Dependency<HttpService>()
		http.syncPlayer({
			user_id: player.UserId,
			cash: profile.Data.cash,
			playtime: profile.Data.playtime,
			robux_spent: profile.Data.robux_spent,
		})
		const collected = profile.Data.collected_checkpoints
		const last_checkpoint = collected.size() > 0 ? math.max(...collected) : 0
		http.sessionLeave(player, last_checkpoint)
	}

	/** Runs a library call that writes (load, save, release) on a kernel thread: a deploy can't cut it off. */
	private detached(job: () => void) {
		TypeTorch.runDetached(job).catch((err) => this.logger.warn(`a data job failed: ${err}`))
	}
}
