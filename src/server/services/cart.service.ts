import {
	CollectionService,
	Debris,
	HttpService,
	MarketplaceService,
	PhysicsService,
	Players,
	Workspace
} from "@rbxts/services"
import { t } from "@rbxts/t"
import type { Trove } from "@rbxts/trove"
import {
	Dependency,
	Module,
	Service,
	TypeTorch,
	type OnInit,
	type OnPlayerAdded,
	type OnStart,
	type PlayerState
} from "@typetorch/framework"
import { CartServerComponent } from "server/components/cart.server.component"
import { A, assets } from "shared/common/assets"
import { getConfig } from "shared/config.helper"
import { Logger } from "shared/common/logger"
import { network } from "shared/net"
import { ButtonModel, ICart } from "shared/type.helper"
import { DataService } from "./data.service"
import type { CheckpointService } from "./checkpoint.service"
import type { ComponentsService } from "./components.service"
import type { CustomizationService } from "./customization.service"
import { OutlineHighlight } from "shared/common/util.helper"
import { CART_TEST_OWNER, CART_TUNING, checkSuspensionStability, getCartDescriptor, getCartOwnerId } from "shared/cart.tuning"
import { prepareRiderBody } from "shared/cart.physics"
import { Tasks } from "shared/tasks"
import type { ProperReturns } from "shared/common/util.helper"

/** Per player, across swaps (plain data): the last safe pose the server saw, and the ride a swap interrupted. */
interface RideState {
	/** CFrame components of the last safe rest pose (the revive anchor). */
	safePivot?: number[]
	/** Set in onSwapOut for a player riding a cart: the next generation gives the cart back. */
	resume?: { skin: string }
}

/** How long the shield lasts on a cart given back after a swap (as a small checkpoint spawn). */
const RESUME_SHIELD = 5
/** Attribute on a shielded cart: its expiry (GetServerTimeNow), so the next generation can take a handed-over shield on. */
const SHIELD_ATTRIBUTE = "ShieldUntil"
/** Seconds the seat may take to appear (the cart component rigs it, deferred) before a spawn gives up seating. */
const SEAT_WAIT = 3
/** Seconds a revive waits for a just-bought revive to be granted (ProcessReceipt) before failing. */
const REVIVE_GRANT_WAIT = 5

@Service()
export class CartService extends Module implements OnInit, OnStart, OnPlayerAdded {
	private readonly logger = new Logger("cart.service")
	constructor(private DataService: DataService) {
		super()
	}
	private readonly PLAYER_CARTS = new Map<Player, ICart>()
	/** The skin each player's current cart was spawned with (for the ride a swap gives back). */
	private readonly PLAYER_SKINS = new Map<Player, string>()
	/** Every cart this generation spawned and that still exists: destroyed when the generation stops. */
	private readonly SPAWNED = new Set<Model>()
	private readonly DEBOUNCE_TABLE = new Map<Player, number>()
	/** Players whose revive is being handled right now. */
	private readonly REVIVING = new Set<Player>()
	private rides!: PlayerState<RideState>
	private tasks!: Tasks

	onInit() {
		this.tasks = new Tasks(this.trove)
		this.rides = this.ctx.playerState<RideState>("cart.rides.v1", () => ({}))
		// World handoff (the template's handoff.ts): a cart is owned by this generation's trove, but a cart someone is
		// riding is handed over to the next generation on a swap that stays on the branch, so the rider keeps going
		// (between two generations there is no code; the cart's constraints and the seat weld keep it whole). Every other
		// cart is destroyed with the generation. On a branch switch nothing is handed over and the next generation gives
		// riders a new cart at their last safe pose instead (`resume`, onPlayerAdded).
		let handOver = false
		this.trove.add(() => {
			for (const cart of this.SPAWNED) {
				if (!(handOver && this.isRidden(cart))) cart.Destroy()
			}
			this.SPAWNED.clear()
		})
		this.trove.add(
			TypeTorch.onSwapOut((info) => {
				handOver = info.branch === undefined || info.branch === TypeTorch.branch
				for (const [player, cart] of this.PLAYER_CARTS) {
					if (!this.isRidden(cart)) continue
					// kept even when the cart is handed over: if the next generation can't adopt it, it rebuilds the ride
					this.rides.get(player).resume = { skin: this.PLAYER_SKINS.get(player) ?? this.getPlayerSkin(player) }
				}
			})
		)
		this.adoptCarts()
	}
	/** True when the cart's owner (or the cloud test's dummy rider) sits in it. */
	private isRidden(cart: Model): boolean {
		const occupant = (cart.FindFirstChild("VehicleSeat") as VehicleSeat | undefined)?.Occupant
		if (!occupant || !cart.IsDescendantOf(Workspace)) return false
		const owner_id = getCartOwnerId(cart)
		if (owner_id === CART_TEST_OWNER) return Workspace.GetAttribute("TypeTorchTest") === true
		const owner = owner_id !== undefined ? Players.GetPlayerByUserId(owner_id) : undefined
		return owner !== undefined && occupant.Parent === owner.Character
	}
	/**
	 * Takes over the carts the previous generation handed over (onInit, before onPlayerAdded replays the players): the
	 * same instances, rider still seated, rig and constraints as they were (CartServerComponent rigs a cart only once).
	 * A cart nobody rides any more is destroyed.
	 */
	private adoptCarts() {
		for (const cart of CollectionService.GetTagged("CartComponent")) {
			if (!cart.IsA("Model") || !cart.IsDescendantOf(Workspace)) continue
			const owner_id = getCartOwnerId(cart)
			if (owner_id === undefined) continue
			if (!this.isRidden(cart)) {
				this.logger.log(`Destroying ${cart.GetFullName()}: handed over without its rider`)
				cart.Destroy()
				continue
			}
			const player = Players.GetPlayerByUserId(owner_id)
			if (player) {
				if (this.PLAYER_CARTS.has(player)) {
					cart.Destroy()
					continue
				}
				this.track(player, cart, getCartDescriptor(cart))
				this.PLAYER_CARTS.set(player, cart as ICart)
				// the ride goes on: nothing to give back
				if (this.rides.has(player)) this.rides.get(player).resume = undefined
				this.logger.log(`Adopted ${player.Name}'s cart ${cart.GetAttribute("CartId")} from the previous generation`)
			} else {
				// the cloud test's dummy rider (selfTestCartHandoff)
				this.SPAWNED.add(cart)
				cart.Destroying.Once(() => this.SPAWNED.delete(cart))
			}
			this.restoreShield(cart)
		}
	}
	getPlayerCarts(player: Player) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return []
		}
		return profile.Data.inventory.vehicles || []
	}
	grantPlayerPermaCart(player: Player, cart_name: string) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return
		}
		const vehicles = profile.Data.inventory.vehicles || []
		if (vehicles.includes(cart_name)) {
			return
		}
		this.logger.log(
			`Granting player ${player.Name} permanent cart: ${cart_name}`
		)
		network.server.NotificationService.sendNotification.fire(player, {
			title: "<b>New Cart Unlocked!</b>",
			duration: 10,
			soundId: A.sounds.party,
			description: `<font color='#00D4FF'>${cart_name}</font>`
		})
		vehicles.push(cart_name)
		profile.Data.inventory.vehicles = vehicles
	}
	doesPlayerOwnCart(player: Player, cart_name: string): boolean {
		const player_carts = this.getPlayerCarts(player)
		return player_carts.includes(cart_name)
	}
	onPlayerAdded(player: Player, playerTrove: Trove) {
		this.resumeRide(player)

		// Set default cart and honk preferences if none exist
		playerTrove.add(task.delay(1, () => {
			const customizationService = Dependency<CustomizationService>()
			
			// Set default cart
			const [cartPrefs, cartErr] = customizationService.getPlayerPreference(
				player,
				"cart"
			)
			if (!cartErr && (!cartPrefs || cartPrefs.size() === 0)) {
				customizationService.setPreference(player, "cart", "Cart")
			}
			
			// Set default honk
			const [honkPrefs, honkErr] = customizationService.getPlayerPreference(
				player,
				"honk"
			)
			if (!honkErr && (!honkPrefs || honkPrefs.size() === 0)) {
				customizationService.setPreference(player, "honk", "Quack")
			}
		}))

		const setupCharacter = (char: Model) => {
			this.logger.log(`Player ${player.Name} spawned in the world`)
			OutlineHighlight(char)
			const humanoid = char.WaitForChild("Humanoid") as Humanoid
			if (humanoid) {
				humanoid.WalkSpeed = 32
			}
			prepareRiderBody(char)
		}
		playerTrove.connect(player.CharacterAdded, setupCharacter)
		// a character that spawned before this generation's onPlayerAdded (the first one on a fresh server, while the
		// payload boots) never saw CharacterAdded; set it up now (a swap replays this for everyone: it is idempotent)
		if (player.Character && !player.Character.GetAttribute("CartRiderBody")) setupCharacter(player.Character)
	}
	validateConfigs(): void {
		const config = getConfig()
		let errors = 0

		const cartConfig = config.CartConfig as defined[]
		if (!typeIs(cartConfig, "table")) {
			this.logger.warn("CartConfig: expected an array, got something else entirely")
			return
		}

		cartConfig.forEach((entry: defined, i) => {
			const c = entry as { name?: unknown; friction?: unknown; power?: unknown; product_id?: unknown; price?: unknown }
			const problems: string[] = []

			if (!t.string(c.name)) problems.push(`name is ${typeOf(c.name)} (expected string)`)
			if (!t.number(c.friction)) problems.push(`friction is ${typeOf(c.friction)} (expected number)`)
			if (!t.number(c.power)) problems.push(`power is ${typeOf(c.power)} (expected number)`)
			if (c.product_id !== undefined && !t.number(c.product_id)) problems.push(`product_id is ${typeOf(c.product_id)} (expected number)`)
			if (c.price !== undefined && !t.number(c.price)) problems.push(`price is ${typeOf(c.price)} (expected number)`)

			if (problems.size() > 0) {
				this.logger.warn(`CartConfig[${i}] (name=${tostring(c.name)}): ${problems.join("; ")}`)
				errors++
				return
			}

			// Check that the referenced cart model actually exists in assets
			const model = assets.carts.FindFirstChild(c.name as string)
			if (!model) {
				this.logger.warn(`CartConfig[${i}] (name=${c.name as string}): no matching cart model found in assets.carts — typo in name?`)
				errors++
			}
		})

		for (const problem of checkSuspensionStability()) {
			this.logger.warn(`CART_TUNING suspension is numerically unstable (carts will fling): ${problem}`)
		}

		if (errors === 0) {
			this.logger.log(`CartConfig validation passed — ${cartConfig.size()} cart entries all OK`)
		}
	}
	onStart(): void {
		this.validateConfigs()
		if (Workspace.GetAttribute("TypeTorchTest") === true) this.tasks.spawn(() => this.selfTestCartHandoff())
		this.trove.add(
			network.server.CartService.spawnCart.on((player, button) => {
				this.spawnPlayerCart(player, button)
			})
		)
		const cooldownEndTimes = new Map<Player, number>()
		this.trove.add(network.server.CartService.honk.on((player) => {
			const now = tick()
			const cooldownEnd = cooldownEndTimes.get(player) ?? 0
			if (now < cooldownEnd) return

			// Get player's honk preference
			const customizationService = Dependency<CustomizationService>()
			const [honkPrefs] = customizationService.getPlayerPreference(player, "honk")
			const honkName = (honkPrefs && honkPrefs.size() > 0) ? honkPrefs[0] : "Quack"

			const sound = (assets.honks.FindFirstChild(honkName) ?? assets.honks.FindFirstChild("Quack")) as Sound | undefined
			if (!sound) return

			const soundDuration = sound.TimeLength
			cooldownEndTimes.set(player, now + soundDuration + 1)

			const cart = this.getPlayerCart(player)
			if (cart) {
				const cloned = sound.Clone()
				cloned.Parent = cart.FindFirstChild("Root")
				cloned.Play()
				// Debris, not an Ended connection: a swap mid-honk hands the cart over and ends this generation's connections
				Debris.AddItem(cloned, soundDuration + 1)
				// Broadcast cart model directly so clients don't need to look it up
				network.server.CartService.honkVfx.fireAll(cart, soundDuration)
			}
		}))

		const damage_parts = Workspace.FindFirstChild("DamageParts") as Folder
		assert(damage_parts, "DamageParts folder not found in workspace")
		damage_parts.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.CollisionGroup = "Spike"
				descendant.AddTag("DamageComponent")
			}
		})
		this.trove.add(
			network.server.CartService.useProduct.handle((player, product_key) => this.useProduct(player, product_key))
		)

		this.trove.add(network.server.CartService.revive.handle(
			async (player, requested_target, stage) => {
				// one revive at a time per player: a second click while the first is still spawning must not use another
				if (this.REVIVING.has(player)) {
					return [false, "Already reviving"]
				}
				this.REVIVING.add(player)
				try {
					return this.revive(player, requested_target, stage)
				} finally {
					this.REVIVING.delete(player)
				}
			}
		))

		this.trove.add(
			network.server.CartService.reset.handle((player) => {
				// this.logger.log(`Respawning player ${player.Name}`)
				const checkpoint_service = Dependency<CheckpointService>()
				checkpoint_service.processPlayerDeath(player)
				return [true]
			})
		)
		// (the last safe pose lives in playerState, which drops a player on a real leave)
		this.trove.connect(Players.PlayerRemoving, (player) => {
			this.PLAYER_SKINS.delete(player)
			this.DEBOUNCE_TABLE.delete(player)
			this.REVIVING.delete(player)
		})
		assets.carts.GetChildren().forEach((cart) => {
			if (!cart.IsA("Model")) return
			cart.AddTag("CartComponent")
		})
		const spike_group = PhysicsService.RegisterCollisionGroup("Spike")
		const hitbox_group = PhysicsService.RegisterCollisionGroup("Hitbox")
		const invincible_group = PhysicsService.RegisterCollisionGroup("Invincible")
		PhysicsService.RegisterCollisionGroup("Players")
		PhysicsService.RegisterCollisionGroup("BigSphere")
		PhysicsService.RegisterCollisionGroup("Wheels")
		PhysicsService.CollisionGroupSetCollidable("Wheels", "Wheels", false)
		PhysicsService.CollisionGroupSetCollidable("Wheels", "Players", false)
		PhysicsService.CollisionGroupSetCollidable("Wheels", "Hitbox", false)
		PhysicsService.CollisionGroupSetCollidable("Wheels", "Spike", false)
		PhysicsService.CollisionGroupSetCollidable("Wheels", "Invincible", false)
		PhysicsService.CollisionGroupSetCollidable("Wheels", "BigSphere", false)
		PhysicsService.CollisionGroupSetCollidable("Spike", "Players", false)
		PhysicsService.CollisionGroupSetCollidable("Hitbox", "Players", false)
		PhysicsService.CollisionGroupSetCollidable("Players", "Players", false)
		PhysicsService.CollisionGroupSetCollidable("Spike", "Hitbox", false)
		PhysicsService.CollisionGroupSetCollidable("Hitbox", "Hitbox", true)
		PhysicsService.CollisionGroupSetCollidable("Hitbox", "Invincible", false)
		PhysicsService.CollisionGroupSetCollidable("Players", "Invincible", false)
		PhysicsService.CollisionGroupSetCollidable("Spike", "Default", false)
		PhysicsService.CollisionGroupSetCollidable(
			"Invincible",
			"Invincible",
			false
		)
		PhysicsService.CollisionGroupSetCollidable("Invincible", "Spike", false)
		PhysicsService.CollisionGroupSetCollidable("Invincible", "Players", false)
		PhysicsService.CollisionGroupSetCollidable("BigSphere", "Invincible", false)
		PhysicsService.CollisionGroupSetCollidable("BigSphere", "Default", false)
		PhysicsService.CollisionGroupSetCollidable("BigSphere", "Players", false)
	}
	/** Revives the player's cart at their last safe pose (the revive leaf, one at a time per player). */
	private revive(player: Player, requested_target: CFrame, stage: number): ProperReturns<true> {
		// never trust the client's position: it must match a pose the server saw
		const target = this.resolveReviveTarget(player, requested_target)
		if (!target) {
			return [false, "No safe position to revive at"]
		}
		// a revive bought from the death screen: the client asks as soon as the purchase prompt closes, which can be
		// before ProcessReceipt granted it, so give the grant a moment
		const deadline = os.clock() + REVIVE_GRANT_WAIT
		while (this.getPlayerRevives(player) <= 0 && os.clock() < deadline && player.Parent === Players) {
			task.wait(0.25)
		}
		// the same server-side product use the useProduct leaf runs (was useProduct.predict)
		const [data, err] = this.useProduct(player, "revives")
		if (!data || err) {
			return [false, err || "Failed to use revive product"]
		}
		const cart = this.spawnPlayerCartAtLocation(player, target, this.getPlayerSkin(player), false)
		// shield first, so no damage part takes a wheel before the rider is in
		this.addShield(cart, 10)
		if (!this.seatPlayer(player, cart)) {
			// no seat or no character: give the revive back rather than leave an empty cart for it
			this.incrementPlayerRevives(player, 1)
			cart.Destroy()
			return [false, "Could not seat you in the revived cart"]
		}
		Dependency<CheckpointService>().setCheckpointIndex(player, stage)
		return [true]
	}
	/**
	 * The cloud test (`typetorch test`) boots a generation, stops it as a swap would and boots a second one with the same
	 * persist store. The first spawns a probe cart (owner CART_TEST_OWNER) with a dummy rider; the second checks that the
	 * swap handed over the same cart, rider still seated, its rig neither rebuilt nor duplicated, then removes it.
	 * Errors fail the test. Physics doesn't step in a Luau Execution task, so motion is the owner's play test.
	 */
	private selfTestCartHandoff() {
		const state = this.ctx.persist<{ cartId?: string; counts?: number[] }>("cart.handofftest.v1", () => ({}))
		const census = (cart: Model) => {
			const all = cart.GetDescendants()
			const count = (check: (d: Instance) => boolean) => all.filter(check).size()
			// descendants, constraints, joints (welds, Motor6Ds, the seat weld), weld constraints, VehicleSeats, BALLs
			return [
				all.size(),
				count((d) => d.IsA("Constraint")),
				count((d) => d.IsA("JointInstance")),
				count((d) => d.IsA("WeldConstraint")),
				count((d) => d.IsA("VehicleSeat")),
				count((d) => d.Name === "BALL")
			]
		}
		if (TypeTorch.startInfo.kind === "swap" && state.cartId !== undefined) {
			const id = state.cartId
			const before = state.counts ?? []
			state.cartId = undefined
			const cart = CollectionService.GetTagged("CartComponent").find((c) => c.GetAttribute("CartId") === id)
			assert(cart && cart.IsA("Model") && cart.IsDescendantOf(Workspace), `cart handoff: probe cart ${id} wasn't handed over`)
			const deadline = os.clock() + 0.6
			while (!Dependency<ComponentsService>().getCart(cart) && os.clock() < deadline) task.wait()
			const component = Dependency<ComponentsService>().getCart(cart)
			const occupant = (cart.FindFirstChild("VehicleSeat") as VehicleSeat | undefined)?.Occupant
			const after = census(cart)
			const owned = this.SPAWNED.has(cart)
			cart.Destroy()
			assert(component, "cart handoff: no CartServerComponent on the adopted cart")
			assert(occupant?.Parent?.Name === "HandoffProbeRider", "cart handoff: the rider isn't seated after the swap")
			assert(owned, "cart handoff: the adopted cart isn't owned by this generation")
			assert(
				before.join(",") === after.join(","),
				`cart handoff: the rig changed (descendants, constraints, joints, welds, seats, balls) ${before.join(",")} -> ${after.join(",")}`
			)
			print(
				`cart handoff self-test: same cart ${id} adopted by generation ${TypeTorch.generation}, rider seated, ` +
					`rig unchanged (descendants, constraints, joints, welds, seats, balls) ${before.join(",")} -> ${after.join(",")}`
			)
			return
		}
		const template = assets.carts.FindFirstChild("Cart") as Model | undefined
		assert(template, "cart handoff: no Cart template")
		const cart = template.Clone()
		cart.Name = "Cart_handoff-probe"
		cart.SetAttribute("CartSkin", "Cart")
		cart.SetAttribute("OwnerUserId", CART_TEST_OWNER)
		cart.SetAttribute("CartId", HttpService.GenerateGUID(false))
		cart.PivotTo(new CFrame(0, 5000, 0))
		// dummy rider inside the cart: handed over and destroyed with it
		const rider = new Instance("Model")
		rider.Name = "HandoffProbeRider"
		const hrp = new Instance("Part")
		hrp.Name = "HumanoidRootPart"
		hrp.Size = new Vector3(2, 2, 1)
		hrp.CFrame = new CFrame(0, 5005, 0)
		hrp.Parent = rider
		rider.PrimaryPart = hrp
		const humanoid = new Instance("Humanoid")
		humanoid.Parent = rider
		this.SPAWNED.add(cart)
		cart.Destroying.Once(() => this.SPAWNED.delete(cart))
		cart.Parent = Workspace
		const seat = cart.WaitForChild("VehicleSeat", 3) as VehicleSeat | undefined
		assert(seat, "cart handoff: the probe cart wasn't rigged")
		rider.Parent = cart
		seat.Sit(humanoid)
		if (seat.Occupant !== humanoid) {
			warn("cart handoff self-test skipped: VehicleSeat.Sit doesn't seat a humanoid in this task")
			cart.Destroy()
			return
		}
		state.cartId = cart.GetAttribute("CartId") as string
		state.counts = census(cart)
		print(`cart handoff self-test: probe cart ${state.cartId} rigged and ridden, ${state.counts.join(",")}`)
	}
	/** The product use behind the useProduct leaf (server-side checks; the client only asks). */
	private useProduct(player: Player, product_key: string): ProperReturns<true> {
		const profile = this.DataService.getProfile(player)
		const available = ["revives", "flips"]
		if (!profile) {
			return [false, "Data not loaded"]
		}
		if (!available.includes(product_key)) {
			return [false, "Invalid product key"]
		}
		switch (product_key) {
			case "revives":
				if ((profile.Data.revives || 0) <= 0) {
					return [false, "Not enough revives"]
				}
				profile.Data.revives = (profile.Data.revives || 0) - 1
				this.logger.log(
					`Player ${player.Name} used a revive. Remaining: ${profile.Data.revives}`
				)
				this.refreshPlayerProducts(player)
				return [true]
			case "flips":
				const cart2 = this.getPlayerCart(player)
				if (cart2) {
					this.addShield(cart2, 10)
				}
				return [true]
			default:
				this.refreshPlayerProducts(player)
				return [false, "Unhandled product key"]
		}
	}
	destroyPlayerCart(player: Player) {}
	/** Called by the cart component whenever the server observes the cart in a safe rest pose. */
	recordSafePivot(player: Player, pivot: CFrame) {
		if (player.Parent !== Players) return
		this.rides.get(player).safePivot = [...pivot.GetComponents()]
	}
	private getSafePivot(player: Player): CFrame | undefined {
		const components = this.rides.has(player) ? this.rides.get(player).safePivot : undefined
		if (!components) return undefined
		const [x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22] = components
		return new CFrame(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22)
	}
	/** A ride a swap interrupted: a new cart at the last safe pose the server saw, with a short shield. */
	private resumeRide(player: Player) {
		if (!this.rides.has(player)) return
		const ride = this.rides.get(player)
		const resume = ride.resume
		ride.resume = undefined
		// the previous generation handed the cart over and this one adopted it (adoptCarts)
		if (this.PLAYER_CARTS.has(player)) return
		const safe = this.getSafePivot(player)
		if (!resume || !safe || !player.Character) return
		this.logger.log(`Giving ${player.Name} their cart back after the update`)
		const cart = this.spawnPlayerCartAtLocation(player, safe, resume.skin, false)
		this.addShield(cart, RESUME_SHIELD)
		// seating waits for the rig: don't hold up the rest of onPlayerAdded
		this.tasks.spawn(() => this.seatPlayer(player, cart))
	}
	/** The client's target if it is close to a pose the server saw, otherwise the server's own. */
	resolveReviveTarget(player: Player, requested: CFrame): CFrame | undefined {
		const safe = this.getSafePivot(player)
		if (!safe) return undefined
		const distance = requested.Position.sub(safe.Position).Magnitude
		if (distance <= CART_TUNING.server.reviveTolerance) {
			return requested
		}
		this.logger.warn(
			`Revive target from ${player.Name} is ${math.floor(distance)} studs from the last safe pose, using the server's`
		)
		return safe
	}
	getPlayerCart(player: Player): ICart | undefined {
		return this.PLAYER_CARTS.get(player)
	}
	getPlayerCartComponent(player: Player): CartServerComponent | undefined {
		const cart = this.getPlayerCart(player)
		if (!cart) {
			return undefined
		}
		return Dependency<ComponentsService>().get(cart, CartServerComponent)
	}
	getPlayerFromCart(cart: Model): Player | undefined {
		for (const [player, playerCart] of this.PLAYER_CARTS) {
			if (playerCart === cart) {
				return player
			}
		}
		return undefined
	}
	getPlayerSkin(player: Player): string {
		const customizationService = Dependency<CustomizationService>()
		const [prefs, err] = customizationService.getPlayerPreference(
			player,
			"cart"
		)

		if (!err && prefs && prefs.size() > 0) {
			return prefs[0]
		}

		// Default to "Cart" if no preference set
		return "Cart"
	}
	refreshPlayerProducts(player: Player) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return
		}
		const products = new Map<string, number>()
		products.set("revives", profile.Data.revives || 0)
		products.set("flips", profile.Data.flips || 0)
		network.server.CartService.playerProductsUpdated.fire(player, products)
	}
	destroyExistingCartsIfAny(player: Player) {
		const existing = this.PLAYER_CARTS.get(player)
		const all_carts = Dependency<ComponentsService>().all(CartServerComponent)
		// by the owner attribute, never the "<skin>_<username>" name (usernames can contain "_")
		const my_cart = all_carts.filter((c) => c.resolvePlayer() === player || getCartOwnerId(c.instance) === player.UserId)
		if (existing) {
			existing.Destroy()
		}
		for (const child of CollectionService.GetTagged("CartComponent")) {
			if (child.IsA("Model") && child.IsDescendantOf(Workspace) && getCartOwnerId(child) === player.UserId) {
				child.Destroy()
			}
		}
		my_cart.forEach((cart) => {
			cart.cleanup()
			cart.instance?.Destroy()
		})
	}
	spawnPlayerCartAtLocation(
		player: Player,
		cframe: CFrame,
		cart_skin?: string,
		seat = true
	): Model {
		this.refreshPlayerProducts(player)
		this.destroyExistingCartsIfAny(player)
		const target_skin = cart_skin ?? this.getPlayerSkin(player)
		const cart_model = this.cloneCart(player, target_skin)
		cart_model.PivotTo(cframe.mul(new CFrame(0, 2, 0)))
		this.track(player, cart_model, target_skin)
		cart_model.Parent = Workspace.FindFirstChild("Carts") || Workspace
		this.recordSafePivot(player, cframe)
		this.PLAYER_CARTS.set(player, cart_model)
		if (seat) this.seatPlayer(player, cart_model)
		network.server.CartService.clearDeathPreview.fire(player)
		return cart_model
	}
	/** A fresh cart of `skin` for `player`, named and stamped with its skin and owner, not parented yet. */
	private cloneCart(player: Player, skin: string): ICart {
		const orig_cart = assets.carts.FindFirstChild(skin) as Model
		assert(orig_cart, `Cart model ${skin} not found in assets`)
		const cart_model = orig_cart.Clone() as ICart
		cart_model.SetAttribute("CartSkin", skin)
		cart_model.SetAttribute("OwnerUserId", player.UserId)
		// one id per cart instance: the client tells a ride it already had (a swap handed the cart over) from a new one
		cart_model.SetAttribute("CartId", HttpService.GenerateGUID(false))
		cart_model.Name = `${skin}_${player.Name}`
		return cart_model
	}
	/**
	 * Puts the player in their freshly parented cart. The VehicleSeat only exists once CartServerComponent has rigged
	 * the model (its tag is handled deferred), so wait for it; the character is moved next to the seat first so the
	 * seat weld doesn't drag the cart across the map (and the cart is streamed in around the player). Returns false
	 * when there is no seat, character or the cart went away.
	 */
	seatPlayer(player: Player, cart: Model): boolean {
		const seat = cart.WaitForChild("VehicleSeat", SEAT_WAIT) as VehicleSeat | undefined
		const humanoid = player.Character?.FindFirstChildOfClass("Humanoid")
		if (!seat || !seat.IsA("VehicleSeat") || !cart.IsDescendantOf(Workspace)) {
			this.logger.warn(`Could not find vehicle seat for cart ${cart.GetFullName()}`)
			return false
		}
		if (!humanoid || humanoid.Health <= 0) return false
		humanoid.Sit = false
		player.Character!.PivotTo(seat.CFrame.mul(new CFrame(0, 3, 0)))
		seat.Sit(humanoid)
		return true
	}
	/** A cart this generation spawned: owned by it until destroyed, and forgotten as the player's cart then. */
	private track(player: Player, cart_model: Model, skin: string) {
		this.SPAWNED.add(cart_model)
		this.PLAYER_SKINS.set(player, skin)
		cart_model.Destroying.Once(() => {
			this.SPAWNED.delete(cart_model)
			// Only remove if this is still the player's active cart
			if (this.PLAYER_CARTS.get(player) === cart_model) {
				this.PLAYER_CARTS.delete(player)
			}
		})
	}
	private readonly SHIELDS = new Map<Model, number>() // Tracks shield expiry time per cart
	private readonly SHIELD_TASKS = new Map<Model, thread>() // Tracks scheduled shield removal tasks
	private readonly DROP_RATE_TRACKER = new Map<
		Model,
		{ lastReset: number; droppedThisSecond: number }
	>()
	private readonly MAX_PARTS_DROP_PER_SECOND = 30 // Configurable limit for dropped parts

	/**
	 * Sets the collision group for all BaseParts in a cart
	 */
	private setCartCollisionGroup(cart: Model, group: string) {
		cart.GetDescendants().forEach((descendant) => {
			if (
				descendant.IsA("BasePart") &&
				(descendant.Name === "Hitbox" || descendant.Name === "BALL")
			) {
				descendant.CollisionGroup = group
			}
		})
	}

	/**
	 * Adds a shield to a cart that prevents parts from dropping
	 * @param cart The cart model to shield
	 * @param duration Duration in seconds
	 */
	addShield(cart: Model, duration: number) {
		const existing = this.SHIELDS.get(cart) || tick()
		const wasShielded = tick() < existing

		// Cancel existing scheduled removal task if any
		const existingTask = this.SHIELD_TASKS.get(cart)
		if (existingTask) {
			this.tasks.cancel(existingTask)
		}

		const player = this.getPlayerFromCart(cart)
		if (player) {
			network.server.NotificationService.sendNotification.fire(player, {
				title: "<b>Shield Activated</b>",
				description: `<font color='#00D4FF'>${duration}</font> seconds of protection`,
				duration: 3,
				soundId: A.sounds.mission_success
			})
		}
		if (wasShielded) {
			// Extend existing shield
			this.SHIELDS.set(cart, existing + duration)
			cart.SetAttribute(SHIELD_ATTRIBUTE, Workspace.GetServerTimeNow() + (existing + duration - tick()))

			// Schedule new removal for the extended time
			const totalDuration = existing + duration - tick()
			const removalTask = this.tasks.delay(totalDuration, () => {
				this.SHIELD_TASKS.delete(cart) // Remove task before cleanup
				this.removeShield(cart)
			})
			this.SHIELD_TASKS.set(cart, removalTask)
			// Find player and send notification
			return
		}

		// New shield - change collision group to Invincible
		const root = cart?.FindFirstChild("Root") as BasePart
		if (root) {
			const vfx = root?.FindFirstChild("ShieldVFX") as Attachment
			if (!vfx) {
				const orig_vfx = assets.FindFirstChild("ShieldVFX") as Attachment
				if (orig_vfx) {
					const vfx_clone = orig_vfx.Clone()
					vfx_clone.Parent = root
				}
			}
		}
		this.SHIELDS.set(cart, tick() + duration)
		cart.SetAttribute(SHIELD_ATTRIBUTE, Workspace.GetServerTimeNow() + duration)
		this.setCartCollisionGroup(cart, "Invincible")

		// Schedule automatic removal
		const removalTask = this.tasks.delay(duration, () => {
			this.SHIELD_TASKS.delete(cart) // Remove task before cleanup
			this.removeShield(cart)
		})
		this.SHIELD_TASKS.set(cart, removalTask)
	}

	/**
	 * A shield on a cart handed over by the previous generation: its expiry lives on the cart (the shield maps and the
	 * removal task ended with that generation), so take over the rest of it, or end it if it ran out in between.
	 */
	private restoreShield(cart: Model) {
		const expires = cart.GetAttribute(SHIELD_ATTRIBUTE)
		if (!typeIs(expires, "number")) return
		const remaining = expires - Workspace.GetServerTimeNow()
		if (remaining <= 0) {
			this.removeShield(cart)
			return
		}
		this.SHIELDS.set(cart, tick() + remaining)
		this.SHIELD_TASKS.set(cart, this.tasks.delay(remaining, () => {
			this.SHIELD_TASKS.delete(cart)
			this.removeShield(cart)
		}))
	}

	/**
	 * Removes shield from a cart and restores collision group
	 * @param cart The cart model to remove shield from
	 */
	removeShield(cart: Model) {
		// Cancel scheduled removal task if any
		const existingTask = this.SHIELD_TASKS.get(cart)
		if (existingTask) {
			this.tasks.cancel(existingTask)
			this.SHIELD_TASKS.delete(cart)
		}

		this.SHIELDS.delete(cart)
		cart.SetAttribute(SHIELD_ATTRIBUTE, undefined)
		this.setCartCollisionGroup(cart, "Hitbox")
		const root = cart?.FindFirstChild("Root") as BasePart
		root?.FindFirstChild("ShieldVFX")?.Destroy()
	}

	/**
	 * Check if a cart currently has shield protection
	 * @param cart The cart model to check
	 * @returns true if the cart is shielded
	 */
	hasShield(cart: Model): boolean {
		const shieldExpiry = this.SHIELDS.get(cart) || 0
		return tick() < shieldExpiry
	}

	/**
	 * Makes parts drop from a cart with rate limiting and shield protection
	 * @param cart The cart model
	 * @param parts Array of parts to drop
	 */
	makePartsDrop(cart: Model, parts: BasePart[]) {
		// Check if cart has shield protection or is an Armored Cart
		if (this.hasShield(cart)) {
			return
		}
		if (getCartDescriptor(cart) === "Armored Cart") {
			return
		}
		// Get or initialize rate tracker
		let tracker = this.DROP_RATE_TRACKER.get(cart)
		const currentTime = tick()

		if (!tracker || currentTime - tracker.lastReset >= 1) {
			// Reset tracker every second
			tracker = { lastReset: currentTime, droppedThisSecond: 0 }
			this.DROP_RATE_TRACKER.set(cart, tracker)
		}

		// Calculate how many parts we can drop this second
		const remainingAllowance =
			this.MAX_PARTS_DROP_PER_SECOND - tracker.droppedThisSecond
		if (remainingAllowance <= 0) {
			// Already dropped max parts this second
			return
		}

		// Drop only up to the remaining allowance
		let droppedCount = 0
		for (
			let i = 0;
			i < parts.size() && droppedCount < remainingAllowance;
			i++
		) {
			const part = parts[i]
			if (["WHEEL", "BALL"].includes(part.Name)) {
				const wheel = part.Parent?.FindFirstChild("WHEEL")
				const ball = part.Parent?.FindFirstChild("BALL")
				wheel?.Destroy()
				ball?.Destroy()
			}
			// detach the part from the cart, whatever joins it (welds, caster motor, suspension)
			part.GetChildren().forEach((child) => {
				if (child.IsA("JointInstance") || child.IsA("WeldConstraint") || child.IsA("Constraint")) {
					child.Destroy()
				}
			})
			droppedCount++
		}

		// Update tracker
		tracker.droppedThisSecond += droppedCount

		// Check if cart still has any BALL parts remaining
		const remainingBalls = cart
			.FindFirstChild("Wheels")
			?.GetDescendants()
			.filter((d) => d.IsA("BasePart") && d.Name === "BALL")

		if ((remainingBalls?.size() || 0) < 1) {
			// No wheels left, cleanup the cart
			const player = this.getPlayerFromCart(cart)
			if (player) {
				const component = this.getPlayerCartComponent(player)
				if (component) {
					component.cleanup()
				}
			}
		}
	}
	getPlayerRevives(player: Player): number {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return 0
		}
		return profile.Data.revives || 0
	}
	makePlayerBuyProduct(player: Player, productId: number) {
		MarketplaceService.PromptProductPurchase(player, productId)
	}
	incrementPlayerRevives(player: Player, amount = 1) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return
		}
		profile.Data.revives = (profile.Data.revives || 0) + amount
		this.logger.log(
			`Incrementing revives for player ${player.Name}, new total: ${profile.Data.revives}`
		)
		network.server.NotificationService.sendNotification.fire(player, {
			title: "<b>Revives Earned</b>",
			description: `<font color='#00FF88'>+${amount}</font> ${amount === 1 ? "revive" : "revives"}`,
			duration: 10
		})
		this.refreshPlayerProducts(player)
		return profile.Data.revives
	}
	incrementPlayerFlips(player: Player, amount = 1) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return
		}
		this.logger.log(`Incrementing flips for player ${player.Name}`)
		profile.Data.flips = (profile.Data.flips || 0) + amount
		network.server.NotificationService.sendNotification.fire(player, {
			title: "<b>Flips Earned</b>",
			description: `<font color='#FFD700'>+${amount}</font> ${amount === 1 ? "flip" : "flips"}`,
			duration: 10
		})
		this.refreshPlayerProducts(player)
		return profile.Data.flips
	}
	spawnPlayerCart(player: Player, button: ButtonModel): Model {
		if (this.DEBOUNCE_TABLE.has(player)) {
			const last_time = this.DEBOUNCE_TABLE.get(player)!
			const existing_cart = this.PLAYER_CARTS.get(player)
			if (tick() - last_time < 2 && existing_cart) {
				// this.logger.warn(`Debouncing cart spawn for player ${player.Name}`)
				return existing_cart
			}
		}
		this.DEBOUNCE_TABLE.set(player, tick())
		this.refreshPlayerProducts(player)
		this.destroyExistingCartsIfAny(player)
		const cart_skin = this.getPlayerSkin(player)
		const cart_model = this.cloneCart(player, cart_skin)
		const cframe_part = button.SpawnPlatform.GetChildren().find(
			(child) => child.IsA("BasePart") && child.Size === new Vector3(8, 0.2, 6)
		) as BasePart
		assert(cframe_part, "Could not find spawn platform")

		cart_model.PivotTo(
			cframe_part
				.GetPivot()
				.mul(new CFrame(0, cart_model.GetExtentsSize().Y / 2 + CART_TUNING.spawn.clearance, 0))
				.mul(CFrame.Angles(0, math.rad(-90), 0))
		)
		this.track(player, cart_model, cart_skin)
		cart_model.Parent = Workspace.FindFirstChild("Carts") || Workspace
		this.recordSafePivot(player, cart_model.GetPivot())
		this.PLAYER_CARTS.set(player, cart_model)
		this.seatPlayer(player, cart_model)
		network.server.CartService.clearDeathPreview.fire(player)
		return cart_model
	}
}
