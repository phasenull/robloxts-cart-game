import { Components } from "@flamework/components"
import { Dependency, OnStart, Service } from "@flamework/core"
import { PhysicsService, Workspace } from "@rbxts/services"
import { CartServerComponent } from "server/components/cart.server.component"
import { assets } from "shared/assets"
import { getConfig } from "shared/config.helper"
import { Logger } from "shared/logger"
import { ServerEvents, ServerFunctions } from "shared/network.helper"
import { ButtonModel } from "shared/type.helper"

@Service()
export class CartService implements OnStart {
	constructor(private logger: Logger) {}
	private readonly PLAYER_CARTS = new Map<Player, Model>()
	onStart(): void {
		ServerEvents.CartService.spawnCart.connect((player, button) => {
			this.logger.log(`Spawning cart for player ${player.Name}`)
			this.spawnPlayerCart(player, button)
		})
		ServerFunctions.CartService.getConfig.setCallback(() => {
			const config = getConfig()
			return [config.CartConfig]
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
		return "Couch Cart"
	}
	spawnPlayerCart(player: Player, button: ButtonModel): Model {
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
			const component = await dependecy.waitForComponent(cart_model,CartServerComponent)
			component.instance.Destroying.Once(() => {
				this.PLAYER_CARTS.delete(player)
			})
			this.logger.log("component added to cart, sitting player")
			const vehicle_seat = cart_model.FindFirstChildWhichIsA("Seat")
			if (vehicle_seat) {
				this.logger.log(`Sitting player ${player.Name} in cart`)
				vehicle_seat.Sit(player.Character?.FindFirstChildOfClass("Humanoid")!)
			} else {
				
				this.logger.warn(`Could not find vehicle seat for cart ${cart_model.GetFullName()}`)
			}
		})
		return cart_model
	}
}
