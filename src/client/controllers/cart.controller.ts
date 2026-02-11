import { Components } from "@flamework/components"
import { Controller, Dependency, OnStart } from "@flamework/core"
import { arrow, point, sphere } from "@rbxts/better-gizmos"
import { MarketplaceService, Players, Workspace } from "@rbxts/services"
import Signal from "@rbxts/signal"
import { CartClientComponent } from "client/components/cart.client.component"
import { UIHelper } from "client/ui.helper"
import { Logger } from "shared/logger"
import { ClientEvents, ClientFunctions } from "shared/network.helper"
import { PRODUCTS } from "shared/purchasables"
import { ProperReturns } from "shared/type.helper"

@Controller({ loadOrder: 5 })
export class CartController implements OnStart {
	constructor(private logger: Logger) {}
	private __last_checkpoint: CFrame | undefined
	saveCheckpoint(cframe: CFrame) {
		this.__last_checkpoint = cframe
	}
	public onCartChange = new Signal<
		(cart: CartClientComponent | undefined) => void
	>()
	public toggleOnDeathScreen = new Signal<
		(spawn_point: CFrame | undefined) => void
	>()
	toggleDeathScreen(enabled: boolean) {
		if (enabled && this.__last_checkpoint) {
			this.toggleOnDeathScreen.Fire(this.__last_checkpoint)
		} else {
			this.toggleOnDeathScreen.Fire(undefined)
		}
	}
	private __is_reviving = false
	private __cached_stage = 0
	async promptRevive(current_stage: number) : Promise<ProperReturns<true>> {
		if (!this.__last_checkpoint) {
			return [false, "No checkpoint to revive to"]
		}
		if (this.__is_reviving) {
			return [false, "Already reviving"]
		}
		this.__is_reviving = true

		const cache = this.__last_checkpoint
		this.__cached_stage = current_stage || 0
		
		this.__is_reviving = true
		this.logger.log("Reviving player...")
		this.__last_checkpoint = undefined
		if (!cache) {
			return [false, "No checkpoint to revive to"]
		}
		// UIHelper.toggleFade(true)
		task.wait(0.5)
		const local_player = Players.LocalPlayer
		const char = local_player.Character
		const [success, err] =
			await ClientFunctions.CartService.revive.invokeWithTimeout(
				5000,
				cache,
				this.__cached_stage
			)
		if (!success) {
			this.logger.warn(`Failed to revive-spawn cart: ${err}`)
			return [success, err]
		}
		this.toggleDeathScreen(false)
		task.wait(0.5)
		// UIHelper.toggleFade(false)
		this.__is_reviving = false
		return [true]
	}
	getMyCart(): CartClientComponent | undefined {
		const components = Dependency<Components>()
		const carts = components.getAllComponents(CartClientComponent)
		const my_cart = carts.find((cart) => {
			return cart.resolvePlayer() === Players.LocalPlayer
		})
		return my_cart
	}
	onStart(): void {
		const components = Dependency<Components>()
	}
}
