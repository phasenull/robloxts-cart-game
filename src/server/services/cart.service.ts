import {
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
import { CART_TUNING, checkSuspensionStability } from "shared/cart.tuning"
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
	private rides!: PlayerState<RideState>
	private tasks!: Tasks

	onInit() {
		this.tasks = new Tasks(this.trove)
		this.rides = this.ctx.playerState<RideState>("cart.rides.v1", () => ({}))
		// Carts belong to the generation that spawned them; riders get theirs back from the next one (onPlayerAdded).
		this.trove.add(() => {
			for (const cart of this.SPAWNED) cart.Destroy()
			this.SPAWNED.clear()
		})
		this.trove.add(
			TypeTorch.onSwapOut(() => {
				for (const [player, cart] of this.PLAYER_CARTS) {
					const seat = cart.FindFirstChildOfClass("VehicleSeat")
					const riding = seat?.Occupant !== undefined && seat.Occupant.Parent === player.Character
					if (riding) this.rides.get(player).resume = { skin: this.PLAYER_SKINS.get(player) ?? this.getPlayerSkin(player) }
				}
			})
		)
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
				cloned.Ended.Once(() => {
					cloned.Destroy()
				})
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
				// never trust the client's position: it must match a pose the server saw
				const target = this.resolveReviveTarget(player, requested_target)
				if (!target) {
					return [false, "No safe position to revive at"]
				}
				// the same server-side product use the useProduct leaf runs (was useProduct.predict)
				const [data, err] = this.useProduct(player, "revives")
				if (!data || err) {
					return [false, err || "Failed to use revive product"]
				}
				// this.logger.log(
				// 	`Revive-spawning cart for player ${player.Name} at stage ${stage}`
				// )
				const cart_skin = this.getPlayerSkin(player)
				const cart = this.spawnPlayerCartAtLocation(player, target, cart_skin)

				if (!cart) {
					return [false, "Failed to spawn cart"] as [false, string]
				}

				// Add shield immediately to prevent race condition with damage parts
				this.addShield(cart, 10)

				const vehicle_seat = cart.FindFirstChildWhichIsA("VehicleSeat")

				const char = player.Character
				const pp = char?.PrimaryPart

				if (vehicle_seat && pp && char) {
					pp.PivotTo(target)
					task.wait(0.5) // Wait for the seat to be fully initialized
					vehicle_seat.Sit(player.Character?.FindFirstChildOfClass("Humanoid")!)
				}
				const checkpoint_service = Dependency<CheckpointService>()
				checkpoint_service.setCheckpointIndex(player, stage)

				return [true] as [true]
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
		const safe = this.getSafePivot(player)
		if (!resume || !safe || !player.Character) return
		this.logger.log(`Giving ${player.Name} their cart back after the update`)
		const cart = this.spawnPlayerCartAtLocation(player, safe, resume.skin)
		this.addShield(cart, RESUME_SHIELD)
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
		const my_cart = all_carts.filter((c) => c.resolvePlayer() === player || c.instance.Name.split("_")[1] === player.Name)
		if (existing) {
			existing.Destroy()
		}
		Workspace.GetChildren().forEach((child) => {
			if (
				child.GetTags().find((e) => e === "CartComponent") &&
				child.IsA("Model")
			) {
				const does_name_match = child.Name.split("_")[1] === player.Name
				if (does_name_match) {
					child.Destroy()
				}
			}
		})
		my_cart.forEach((cart) => {
			cart.cleanup()
			cart.instance?.Destroy()
		})
	}
	spawnPlayerCartAtLocation(
		player: Player,
		cframe: CFrame,
		cart_skin?: string
	): Model {
		this.refreshPlayerProducts(player)
		this.destroyExistingCartsIfAny(player)
		const target_skin = cart_skin ?? this.getPlayerSkin(player)
		const orig_cart = assets.carts.FindFirstChild(target_skin) as Model
		assert(orig_cart, `Cart model ${target_skin} not found in assets`)
		const cart_model = orig_cart.Clone() as ICart

		this.track(player, cart_model, target_skin)
		cart_model.Parent = Workspace.FindFirstChild("Carts") || Workspace
		cart_model.PivotTo(cframe.mul(new CFrame(0, 2, 0)))
		this.recordSafePivot(player, cframe)
		this.PLAYER_CARTS.set(player, cart_model)
		cart_model.Name = `${cart_model.Name}_${player.Name}`
		// The "CartComponent" tag (cloned with the model) makes ComponentsService build its CartServerComponent.
		// Sit player after a short delay to ensure seat is ready
		const vehicle_seat = cart_model.FindFirstChildWhichIsA("VehicleSeat")
		if (vehicle_seat && player.Character) {
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid")
			if (humanoid) {
				task.wait(0.1)
				vehicle_seat.Sit(humanoid)
			}
		}
		network.server.CartService.clearDeathPreview.fire(player)
		return cart_model
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
		this.setCartCollisionGroup(cart, "Invincible")

		// Schedule automatic removal
		const removalTask = this.tasks.delay(duration, () => {
			this.SHIELD_TASKS.delete(cart) // Remove task before cleanup
			this.removeShield(cart)
		})
		this.SHIELD_TASKS.set(cart, removalTask)
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
		const cartIdentifier = (cart.FindFirstChild("CartIdentifier") as StringValue | undefined)?.Value ?? cart.Name.split("_")[0]
		if (cartIdentifier === "Armored Cart") {
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
		const orig_cart = assets.carts.FindFirstChild(cart_skin) as Model
		assert(orig_cart, `Cart model ${cart_skin} not found in assets`)
		const cart_model = orig_cart.Clone() as ICart
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
		cart_model.Name = `${cart_model.Name}_${player.Name}`
		// Sit player after a short delay to ensure seat is ready
		const vehicle_seat = cart_model.FindFirstChildWhichIsA("VehicleSeat")
		if (vehicle_seat && player.Character) {
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid")
			if (humanoid) {
				task.wait(0.1)
				vehicle_seat.Sit(humanoid)
			}
		} else if (!vehicle_seat) {
			this.logger.warn(
				`Could not find vehicle seat for cart ${cart_model.GetFullName()}`
			)
		}
		network.server.CartService.clearDeathPreview.fire(player)
		return cart_model
	}
}
