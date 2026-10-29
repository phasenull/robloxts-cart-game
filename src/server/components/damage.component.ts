import type { Trove } from "@rbxts/trove"
import { Dependency } from "@typetorch/framework"
import type { CartService } from "server/services/cart.service"
import { CartTouch } from "shared/components/cart-touch.component"

/** Tag "DamageComponent" (BasePart): knocks parts off carts that touch it. */
export class DamageComponent extends CartTouch {
	constructor(instance: BasePart, trove: Trove) {
		super(instance, trove)
		this.instance.CollisionGroup = "Spike"
	}
	onTouch(other_part: BasePart, cart_model: Model) {
		const visuals = cart_model.FindFirstChild("Visuals")
		assert(visuals, `Cart ${cart_model.GetFullName()} is missing Visuals part`)
		// const is_visuals = other_part.IsDescendantOf(visuals)
		// if (!is_visuals) return
		if (["Root","Mass","VehicleSeat","Hitbox","IgnoreDestruction"].includes(other_part.Name)) {
			return
		}
		if (this.instance.IsDescendantOf(cart_model)) {
			// spike cart
			return
		}
		const cart_service = Dependency<CartService>()
		cart_service.makePartsDrop(cart_model,[other_part])
	}
}
