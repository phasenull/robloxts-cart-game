import { Components } from "@flamework/components"
import { Dependency, OnStart, Service } from "@flamework/core"
import {
	MarketplaceService,
	PhysicsService,
	Players,
	Workspace
} from "@rbxts/services"
import { t } from "@rbxts/t"
import { CartServerComponent } from "server/components/cart.server.component"
import { A, assets } from "@common/shared/assets"
import { getConfig } from "shared/config.helper"
import { Logger } from "@common/shared/logger"
import { ServerEvents, ServerFunctions } from "shared/network.helper"
import { ButtonModel, ICart } from "shared/type.helper"
import { DataService } from "./data.service"
import { PRODUCTS } from "shared/purchasables"
import { CheckpointService } from "./checkpoint.service"
import { CustomizationService } from "./customization.service"
import { arrow } from "@rbxts/better-gizmos"
import StringUtils from "@rbxts/string-utils"
import { isTester } from "@common/shared/role.utils"
import { OutlineHighlight } from "@common/shared/util.helper"

@Service()
export class CartService implements OnStart {
	constructor(
		private logger: Logger,
		private DataService: DataService
	) {}
	private readonly PLAYER_CARTS = new Map<Player, ICart>()
	private readonly DEBOUNCE_TABLE = new Map<Player, number>()
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
		ServerEvents.NotificationService.sendNotification(player, {
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
	playerAdded(player: Player) {

		// Set default cart and honk preferences if none exist
		task.delay(1, () => {
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
		})

		player.CharacterAdded.Connect((char) => {
			this.logger.log(`Player ${player.Name} spawned in the world`)
			OutlineHighlight(char)
			const humanoid = char.WaitForChild("Humanoid") as Humanoid
			if (humanoid) {
				humanoid.WalkSpeed = 32
			}
			char.GetDescendants().forEach((descendant) => {
				if (descendant.IsA("BasePart")) {
					descendant.Massless = true
					descendant.CollisionGroup = "Players"
				}
			})
		})
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

		if (errors === 0) {
			this.logger.log(`CartConfig validation passed — ${cartConfig.size()} cart entries all OK`)
		}
	}
	onStart(): void {
		this.validateConfigs()
		ServerEvents.CartService.spawnCart.connect((player, button) => {
			this.spawnPlayerCart(player, button)
		})
		const cooldownEndTimes = new Map<Player, number>()
		ServerEvents.CartService.honk.connect((player) => {
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
				ServerEvents.CartService.honkVfx.broadcast(cart, soundDuration)
			}
		})
		Players.PlayerAdded.Connect((player) => this.playerAdded(player))

		const damage_parts = Workspace.FindFirstChild("DamageParts") as Folder
		assert(damage_parts, "DamageParts folder not found in workspace")
		damage_parts.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.CollisionGroup = "Spike"
				descendant.AddTag("DamageComponent")
			}
		})
		ServerFunctions.CartService.useProduct.setCallback(
			(player, product_key) => {
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
						if ((profile.Data.flips || 0) <= 0) {
							return [false, "Not enough flips"]
						}
						profile.Data.flips = (profile.Data.flips || 0) - 1
						this.logger.log(
							`Player ${player.Name} used a flip. Remaining: ${profile.Data.flips}`
						)
						const cart2 = this.getPlayerCart(player)
						if (cart2) {
							this.addShield(cart2, 10)
						}
						this.refreshPlayerProducts(player)
						return [true]
					default:
						this.refreshPlayerProducts(player)
						return [false, "Unhandled product key"]
				}
			}
		)

		ServerFunctions.CartService.getConfig.setCallback(() => {
			const config = getConfig()
			return [config.CartConfig]
		})

		ServerFunctions.CartService.revive.setCallback(
			async (player, target, stage) => {
				// this.logger.warn("REVIVE RF CALLED")
				// return [true]
				const [data, err] =
					await ServerFunctions.CartService.useProduct.predict(
						player,
						"revives"
					)
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

				const vehicle_seat = cart.FindFirstChildWhichIsA("Seat")

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
		)

		ServerFunctions.CartService.reset.setCallback((player) => {
			// this.logger.log(`Respawning player ${player.Name}`)
			const checkpoint_service = Dependency<CheckpointService>()
			checkpoint_service.processPlayerDeath(player)
		})
		ServerEvents.CartService.cleanupCart.connect((player) => {
			const cart = this.getPlayerCartComponent(player)
			if (cart) {
				cart.cleanup()
			}
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
	destroyPlayerCart(player: Player) {}
	getPlayerCart(player: Player): ICart | undefined {
		return this.PLAYER_CARTS.get(player)
	}
	getPlayerCartComponent(player: Player): CartServerComponent | undefined {
		const cart = this.getPlayerCart(player)
		if (!cart) {
			return undefined
		}
		const dependecy = Dependency<Components>()
		const component = dependecy.getComponent(cart, CartServerComponent)
		return component
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
		ServerEvents.CartService.playerProductsUpdated(player, products)
	}
	destroyExistingCartsIfAny(player: Player) {
		const existing = this.PLAYER_CARTS.get(player)
		const dep = Dependency<Components>()
		const all_carts = dep.getAllComponents<CartServerComponent>()
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

		cart_model.Parent = Workspace.FindFirstChild("Carts") || Workspace
		cart_model.PivotTo(cframe.mul(new CFrame(0, 2, 0)))
		this.PLAYER_CARTS.set(player, cart_model)
		const dependecy = Dependency<Components>()
		cart_model.Name = `${cart_model.Name}_${player.Name}`
		const cart = dependecy.addComponent(cart_model, CartServerComponent)
		task.spawn(async () => {
			const component = await dependecy.waitForComponent(
				cart_model,
				CartServerComponent
			)
			component.instance.Destroying.Once(() => {
				cart.cleanup()
				// Only remove if this is still the player's active cart
				if (this.PLAYER_CARTS.get(player) === cart_model) {
					this.PLAYER_CARTS.delete(player)
				}
			})
		})
		// Sit player after a short delay to ensure seat is ready
		const vehicle_seat = cart_model.FindFirstChildWhichIsA("Seat")
		if (vehicle_seat && player.Character) {
			const humanoid = player.Character.FindFirstChildOfClass("Humanoid")
			if (humanoid) {
				task.wait(0.1)
				vehicle_seat.Sit(humanoid)
			}
		}
		ServerEvents.CartService.clearDeathPreview(player)
		return cart_model
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
			task.cancel(existingTask)
		}

		const player = this.getPlayerFromCart(cart)
		if (player) {
			ServerEvents.NotificationService.sendNotification(player, {
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
			const removalTask = task.delay(totalDuration, () => {
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
		const removalTask = task.delay(duration, () => {
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
			task.cancel(existingTask)
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
			const weld_constraints = part.FindFirstChildOfClass("WeldConstraint")
			const weld = part.FindFirstChildOfClass("Weld")
			const ball_socket = part.FindFirstChildOfClass("BallSocketConstraint")
			const hinge = part.FindFirstChildOfClass("HingeConstraint")
			if (ball_socket) {
				ball_socket.Destroy()
			}
			if (hinge) {
				hinge.Destroy()
			}
			if (weld_constraints) {
				weld_constraints.Destroy()
			}
			if (weld) {
				weld.Destroy()
			}
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
		ServerEvents.NotificationService.sendNotification(player, {
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
		ServerEvents.NotificationService.sendNotification(player, {
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
				.mul(new CFrame(0, cart_model.GetExtentsSize().Y / 2, 0))
				.mul(CFrame.Angles(0, math.rad(-90), 0))
		)
		cart_model.Parent = Workspace.FindFirstChild("Carts") || Workspace
		this.PLAYER_CARTS.set(player, cart_model)
		const dependecy = Dependency<Components>()
		cart_model.Name = `${cart_model.Name}_${player.Name}`
		task.spawn(async () => {
			const component = await dependecy.waitForComponent(
				cart_model,
				CartServerComponent
			)
			component.instance.Destroying.Once(() => {
				// Only remove if this is still the player's active cart
				if (this.PLAYER_CARTS.get(player) === cart_model) {
					this.PLAYER_CARTS.delete(player)
				}
			})
		})
		// Sit player after a short delay to ensure seat is ready
		const vehicle_seat = cart_model.FindFirstChildWhichIsA("Seat")
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
		ServerEvents.CartService.clearDeathPreview(player)
		return cart_model
	}
}
