import React, { Fragment } from "@rbxts/react"
import { useCart } from "client/ui/contexts/cart.context"
import { CartButtons } from "./cart-buttons"
import { SpeedometerHud } from "./cart-speedometer"

export function CartHud(props: {
	__story?: {
		cart_enabled: boolean
		override_speed: number
		override_brake: boolean
		override_device: "Gamepad" | "Keyboard" | "Mobile"
	}
}) {
	const { cart, state } = useCart()

	return (
		<Fragment>
			<CartButtons cart={cart} state={state} __story={props.__story} />
			<SpeedometerHud cart={cart} __story={props.__story} />
		</Fragment>
	)
}
