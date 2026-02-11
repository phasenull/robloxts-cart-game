import { Components } from "@flamework/components"
import { Dependency, OnStart, Service } from "@flamework/core"
import {
	MarketplaceService,
	PhysicsService,
	Players,
	Workspace
} from "@rbxts/services"
import { CartServerComponent } from "server/components/cart.server.component"
import { assets } from "shared/assets"
import { getConfig } from "shared/config.helper"
import { Logger } from "shared/logger"
import { ServerEvents, ServerFunctions } from "shared/network.helper"
import { ButtonModel } from "shared/type.helper"
import { DataService } from "./data.service"
import { PRODUCTS } from "shared/purchasables"
import { CheckpointService } from "./checkpoint.service"

@Service()
export class CartService implements OnStart {
	constructor(
		private logger: Logger,
		private DataService: DataService
	) {}
	private readonly PLAYER_CARTS = new Map<Player, Model>()
	private readonly DEBOUNCE_TABLE = new Map<Player, number>()
	getPlayerCarts(player: Player) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return []
		}
		return profile.Data.vehicles || []
	}
	grantPlayerPermaCart(player: Player, cart_name: string) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return
		}
		this.logger.log(
			`Granting player ${player.Name} permanent cart: ${cart_name}`
		)
		const vehicles = profile.Data.vehicles || []
		if (!vehicles.includes(cart_name)) {
			vehicles.push(cart_name)
			profile.Data.vehicles = vehicles
		}
	}
	doesPlayerOwnCart(player: Player, cart_name: string): boolean {
		const player_carts = this.getPlayerCarts(player)
		return player_carts.includes(cart_name)
	}

	onStart(): void {
		ServerEvents.CartService.spawnCart.connect((player, button) => {
			this.logger.log(`Spawning cart for player ${player.Name}`)
			this.spawnPlayerCart(player, button)
		})
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
						task.spawn(() => {
							let cart = this.getPlayerCart(player)
							for (let index = 0; index < 100; index++) {
								task.wait(0.1)
								cart = this.getPlayerCart(player)
								if (cart) {
									break
								}
							}
							if (cart) {
								this.addShield(cart, 10)
							}
						})
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

		ServerFunctions.CartService.reviveSpawn.setCallback(
			(player, target, stage) => {
				this.logger.log(
					`Revive-spawning cart for player ${player.Name} at stage ${stage}`
				)
				try {
					const cart_skin = this.getPlayerSkin(player)
					const cart = this.spawnPlayerCartAtLocation(player, target, cart_skin)
					const checkpoint_service = Dependency<CheckpointService>()
					checkpoint_service.setCheckpointIndex(player, stage)
					if (!cart) {
						return [false, "Failed to spawn cart"] as [false, string]
					}
					return [true] as [true]
				} catch (e) {
					this.logger.warn(
						`Failed to revive-spawn cart for ${player.Name}: ${e}`
					)
					return [false, `Failed to spawn cart: ${e}`] as [false, string]
				}
			}
		)

		ServerFunctions.CartService.respawn.setCallback((player) => {
			this.logger.log(`Respawning player ${player.Name}`)
			this.reloadCharacter(player)
		})
		assets.carts.GetChildren().forEach((cart) => {
			if (!cart.IsA("Model")) return
			cart.AddTag("CartComponent")
		})
		const spike_group = PhysicsService.RegisterCollisionGroup("Spike")
		const hitbox_group = PhysicsService.RegisterCollisionGroup("Hitbox")
		const invincible_group = PhysicsService.RegisterCollisionGroup("Invincible")
		PhysicsService.CollisionGroupSetCollidable("Spike", "Hitbox", false)
		PhysicsService.CollisionGroupSetCollidable("Hitbox", "Hitbox", true)
		PhysicsService.CollisionGroupSetCollidable("Hitbox", "Invincible", false)
		PhysicsService.CollisionGroupSetCollidable(
			"Invincible",
			"Invincible",
			false
		)
		PhysicsService.CollisionGroupSetCollidable("Invincible", "Spike", false)
	}
	destroyPlayerCart(player: Player) {}
	getPlayerCart(player: Player): Model | undefined {
		return this.PLAYER_CARTS.get(player)
	}
	getPlayerSkin(player: Player): string {
		return "Cart"
	}
	reloadCharacter(player: Player) {
		player.LoadCharacterAsync()
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
	spawnPlayerCartAtLocation(
		player: Player,
		cframe: CFrame,
		cart_skin?: string
	): Model {
		this.refreshPlayerProducts(player)
		const existing = this.PLAYER_CARTS.get(player)
		existing?.Destroy()
		const target_skin = cart_skin ?? this.getPlayerSkin(player)
		const orig_cart = assets.carts.FindFirstChild(target_skin) as Model
		assert(orig_cart, `Cart model ${target_skin} not found in assets`)
		const cart_model = orig_cart.Clone()

		cart_model.Parent = Workspace
		cart_model.PivotTo(cframe)
		this.PLAYER_CARTS.set(player, cart_model)
		const dependecy = Dependency<Components>()
		cart_model.Name = `${cart_model.Name}_${player.Name}`
		task.spawn(async () => {
			const component = await dependecy.waitForComponent(
				cart_model,
				CartServerComponent
			)
			component.instance.Destroying.Once(() => {
				this.PLAYER_CARTS.delete(player)
			})
			const vehicle_seat = cart_model.FindFirstChildWhichIsA("Seat")
			if (vehicle_seat) {
				vehicle_seat.Sit(player.Character?.FindFirstChildOfClass("Humanoid")!)
			} else {
				this.logger.warn(
					`Could not find vehicle seat for cart ${cart_model.GetFullName()}`
				)
			}
		})
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
	 * Sets the collision group for Hitbox and BALL parts in a cart
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
			return
		}

		// New shield - change collision group to Invincible
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
		// Check if cart has shield protection
		if (this.hasShield(cart)) {
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
		this.logger.log(`Incrementing revives for player ${player.Name}`)
		profile.Data.revives = (profile.Data.revives || 0) + amount
	}
	incrementPlayerFlips(player: Player, amount = 1) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return
		}
		this.logger.log(`Incrementing flips for player ${player.Name}`)
		profile.Data.flips = (profile.Data.flips || 0) + amount
	}
	spawnPlayerCart(player: Player, button: ButtonModel): Model {
		if (this.DEBOUNCE_TABLE.has(player)) {
			const last_time = this.DEBOUNCE_TABLE.get(player)!
			if (tick() - last_time < 1) {
				this.logger.warn(`Debouncing cart spawn for player ${player.Name}`)
				return this.PLAYER_CARTS.get(player)!
			}
		}
		this.DEBOUNCE_TABLE.set(player, tick())
		this.refreshPlayerProducts(player)
		const existing = this.PLAYER_CARTS.get(player)
		existing?.Destroy()
		const cart_skin = this.getPlayerSkin(player)
		const orig_cart = assets.carts.FindFirstChild(cart_skin) as Model
		assert(orig_cart, `Cart model ${cart_skin} not found in assets`)
		const cart_model = orig_cart.Clone()
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
		cart_model.Parent = Workspace
		this.PLAYER_CARTS.set(player, cart_model)
		const dependecy = Dependency<Components>()
		cart_model.Name = `${cart_model.Name}_${player.Name}`
		task.spawn(async () => {
			const component = await dependecy.waitForComponent(
				cart_model,
				CartServerComponent
			)
			component.instance.Destroying.Once(() => {
				this.PLAYER_CARTS.delete(player)
			})
			const vehicle_seat = cart_model.FindFirstChildWhichIsA("Seat")
			if (vehicle_seat) {
				this.logger.log(`Sitting player ${player.Name} in cart`)
				vehicle_seat.Sit(player.Character?.FindFirstChildOfClass("Humanoid")!)
			} else {
				this.logger.warn(
					`Could not find vehicle seat for cart ${cart_model.GetFullName()}`
				)
			}
		})
		return cart_model
	}
}
