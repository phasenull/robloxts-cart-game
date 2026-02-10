import { Component } from "@flamework/components"
import { Dependency } from "@flamework/core"
import { CartService } from "server/services/cart.service"
import { CartTouch } from "shared/components/cart-touch.component"
import { Logger } from "shared/logger"

@Component({ tag: "DamageComponent" })
export class DamageComponent extends CartTouch {
	constructor(private logger: Logger) {
		super()
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
		const cart_service = Dependency<CartService>()
		cart_service.makePartsDrop(cart_model,[other_part])
	}
}
