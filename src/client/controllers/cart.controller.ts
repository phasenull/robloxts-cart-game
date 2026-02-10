import { Components } from "@flamework/components"
import { Controller, Dependency, OnStart } from "@flamework/core"
import { arrow } from "@rbxts/better-gizmos"
import { MarketplaceService, Players, Workspace } from "@rbxts/services"
import Signal from "@rbxts/signal"
import { ButtonComponent } from "client/components/button.component"
import { CartClientComponent } from "client/components/cart.client.component"
import { UIHelper } from "client/ui.helper"
import { Logger } from "shared/logger"
import { ClientEvents, ClientFunctions } from "shared/network.helper"
import { PRODUCTS } from "shared/purchasables"
import { ButtonModel } from "shared/type.helper"

@Controller({ loadOrder: 5 })
export class CartController implements OnStart {
	constructor(private logger: Logger) {}
	private __last_checkpoint: CFrame | undefined
	private arrow = arrow
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
	private readonly revive_product_id = 3532858318
	private __is_reviving = false
	async promptRevive() {
		if (!this.__last_checkpoint) {
			return
		}
		if (this.__is_reviving) {
			return
		}
		this.__is_reviving = true

		const cache = this.__last_checkpoint
		const [use_result, err] =
			await ClientFunctions.CartService.useProduct.invokeWithTimeout(
				5000,
				"revives"
			)
		if (use_result) {
			this.revivePlayer(cache)
			return true
		}
		MarketplaceService.PromptProductPurchase(
			Players.LocalPlayer,
			PRODUCTS.revives
		)
		const connection = MarketplaceService.PromptProductPurchaseFinished.Connect(
			async (user_id, assetId, wasPurchased) => {
				if (user_id !== Players.LocalPlayer.UserId) return
				if (assetId !== PRODUCTS.revives) return
				connection.Disconnect()
				if (!wasPurchased) return
				this.revivePlayer(cache)
				await ClientFunctions.CartService.useProduct.invokeWithTimeout(
					5000,
					"revives"
				)
			}
		)
	}
	revivePlayer(target: CFrame) {
		this.__is_reviving = true
		this.logger.log("Reviving player...")
		this.__last_checkpoint = undefined
		if (!target) {
			return
		}
		const components = Dependency<Components>()
		const random_button = components.getAllComponents(ButtonComponent)[0]
		if (!random_button) {
			return
		}
		UIHelper.toggleFade(true)
		task.wait(0.5)
		this.toggleDeathScreen(false)
		ClientEvents.CartService.spawnCart.fire(random_button.instance)
		task.wait(0.5)
		const cart = this.getMyCart()
		if (cart) {
			cart.instance.PivotTo(target)
		}
		UIHelper.toggleFade(false)
		this.__is_reviving = false
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
