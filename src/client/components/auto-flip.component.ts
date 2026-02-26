import { Component } from "@flamework/components"
import { Dependency } from "@flamework/core"
import { Players } from "@rbxts/services"
import { CartClientComponent } from "client/components/cart.client.component"
import { CartTriggerComponent } from "client/components/cart-trigger.component"
import { CartController } from "client/controllers/cart.controller"
import { Logger } from "shared/logger"

interface AutoFlipTrigger extends Model {
	Trigger: BasePart
}

@Component({ tag: "AutoFlipComponent" })
export class AutoFlipComponent extends CartTriggerComponent<{}, AutoFlipTrigger> {
	private currentCart: CartClientComponent | undefined

	constructor(logger: Logger) {
		super(logger)
		this.setColor(new Color3(0, 1, 0.5))

		const cartController = Dependency<CartController>()
		cartController.onCartChange.Connect((cart) => {
			this.currentCart = cart
		})
	}

	private isCartFlipped(): boolean {
		const root = this.currentCart?.instance.FindFirstChild("Root") as BasePart | undefined
		if (!root) return false
		// Cart is flipped when its up-vector points downward
		return new CFrame().UpVector.Dot(root.CFrame.UpVector) < 0
	}

	onTouch(touch_part: BasePart): void {
		const character = Players.LocalPlayer.Character
		if (!character) return
		if (!touch_part.IsDescendantOf(character)) return
		if (!this.currentCart) return
		if (!this.isCartFlipped()) return

		this.currentCart.flipCart()
	}
}
