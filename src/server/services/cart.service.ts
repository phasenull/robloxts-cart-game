import { OnStart, Service } from "@flamework/core"
import { Workspace } from "@rbxts/services"
import { assets } from "shared/assets"
import { Logger } from "shared/logger"
import { ServerEvents } from "shared/network.helper"
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


	}
	destroyPlayerCart(player: Player) {}
	getPlayerCart(player: Player): Model | undefined {
		return this.PLAYER_CARTS.get(player)
	}
	private readonly cart_model= assets.FindFirstChild("Cart") as Model
	spawnPlayerCart(player: Player, button: ButtonModel): Model {
		const existing = this.PLAYER_CARTS.get(player)
		existing?.Destroy()
		const cart = this.cart_model.Clone()
		const cframe_part = button.SpawnPlatform.GetChildren().find(
			(child) =>
				child.IsA("BasePart") && child.Size === new Vector3(8, 0.2, 6)
		) as BasePart
		assert(cframe_part, "Could not find spawn platform")

		cart.PivotTo(
			cframe_part.GetPivot().mul(new CFrame(0, this.cart_model.GetExtentsSize().Y / 2, 0)).mul(CFrame.Angles(0, math.rad(-90), 0))
		)
		cart.Name = `Cart_${player.Name}`
		cart.Parent = Workspace
		this.PLAYER_CARTS.set(player, cart)
		return cart
	}
}
