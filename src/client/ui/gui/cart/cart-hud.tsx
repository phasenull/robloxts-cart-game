import React, { Fragment } from "@rbxts/react"
import { useCart } from "client/ui/contexts/cart.context"
import { CartButtons } from "./cart-buttons"
import { SpeedometerHud } from "./cart-speedometer"
import { StageProgress } from "./stage-progress"

export function CartHud(props: {
	__story?: {
		cart_enabled: boolean
		override_speed: number
		override_brake: boolean
		override_device: "Gamepad" | "Keyboard" | "Mobile"
	}
}) {
	const {cart}= useCart()
	return (
		<Fragment>
			{cart ? <StageProgress/> : undefined}
			<CartButtons  __story={props.__story} />
			<SpeedometerHud __story={props.__story} />
		</Fragment>
	)
}
