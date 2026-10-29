import { Players } from "@rbxts/services"
import type { Trove } from "@rbxts/trove"
import { Dependency } from "@typetorch/framework"
import type { CartClientComponent } from "client/components/cart.client.component"
import { CartTriggerComponent } from "client/components/cart-trigger.component"
import type { CartController } from "client/controllers/cart.controller"
import { Logger } from "shared/common/logger"

interface AutoFlipTrigger extends Model {
	Trigger: BasePart
}

/** Tag "AutoFlipComponent": flips the local player's cart upright when it drives through upside down. */
export class AutoFlipComponent extends CartTriggerComponent<AutoFlipTrigger> {
	protected logger = new Logger("autoflip.component")
	private currentCart: CartClientComponent | undefined

	constructor(instance: AutoFlipTrigger, trove: Trove) {
		super(instance, trove)
		this.setColor(new Color3(0, 1, 0.5))
	}

	onStart(): void {
		const cartController = Dependency<CartController>()
		this.trove.add(
			cartController.onCartChange.Connect((cart) => {
				this.currentCart = cart
			})
		)
	}

	onTouch(touch_part: BasePart): void {
		const character = Players.LocalPlayer.Character
		if (!character) return
		if (!touch_part.IsDescendantOf(character)) return
		if (!this.currentCart) return
		if (!this.currentCart.isUpsideDown()) return

		this.currentCart.flipUpright()
	}
}
