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

@Service()
export class CartService implements OnStart {
	constructor(
		private logger: Logger,
		private DataService: DataService
	) {}
	private readonly PLAYER_CARTS = new Map<Player, Model>()
	private readonly DEBOUNCE_TABLE = new Map<Player, number>()
	private readonly revive_product_id = PRODUCTS.revives
	private readonly flip_product_id = PRODUCTS.flips
	onStart(): void {
		ServerEvents.CartService.spawnCart.connect((player, button) => {
			this.logger.log(`Spawning cart for player ${player.Name}`)
			this.spawnPlayerCart(player, button)
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
						this.refreshPlayerProducts(player)
						return [true]
					default:
						this.refreshPlayerProducts(player)
						return [false, "Unhandled product key"]
				}
			}
		)
		MarketplaceService.PromptProductPurchaseFinished.Connect(
			(user_id, assetId, isPurchased) => {
				const player = Players.GetPlayerByUserId(user_id)
				if (!player) {
					return
				}
				if (!isPurchased) return
				switch (assetId) {
					case this.revive_product_id:
						this.incrementPlayerRevives(player)
						break
					case this.flip_product_id:
						this.incrementPlayerFlips(player)
						break
				}
			}
		)
		ServerFunctions.CartService.getConfig.setCallback(() => {
			const config = getConfig()
			return [config.CartConfig]
		})
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
		PhysicsService.CollisionGroupSetCollidable("Spike", "Hitbox", false)
		PhysicsService.CollisionGroupSetCollidable("Hitbox", "Hitbox", true)
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

		cart_model.PivotTo(
			cframe
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
			this.logger.log("component added to cart, sitting player")
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
	incrementPlayerRevives(player: Player) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return
		}
		this.logger.log(`Incrementing revives for player ${player.Name}`)
		profile.Data.revives = (profile.Data.revives || 0) + 1
	}
	incrementPlayerFlips(player: Player) {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			return
		}
		this.logger.log(`Incrementing flips for player ${player.Name}`)
		profile.Data.flips = (profile.Data.flips || 0) + 1
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
			this.logger.log("component added to cart, sitting player")
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
