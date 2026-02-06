import React, { Fragment, useEffect } from "@rbxts/react"
import Signal from "@rbxts/signal"
import { CartClientComponent } from "client/components/cart.client.component"
import { Logger } from "shared/logger"
import { CartButtons } from "./cart-buttons"
import { SpeedometerHud } from "./cart-speedometer"
const logger = new Logger("CartHud")
export function CartHud(props: {
	__story?: {
		cart_enabled: boolean
		override_speed: number
		override_brake: boolean
	}
}) {
	const [cart, setCart] = React.useState<CartClientComponent | undefined>(
		undefined
	)
	
	useEffect(() => {
		const connection = CartLisener.Connect((cart) => {
			logger.log(`Received cart update!: ${cart?.instance.GetFullName()}`)
			setCart(cart)
		})
		return () => {
			connection.Disconnect()
		}
	}, [])
	return (
		<Fragment>
			<CartButtons cart={cart} __story={props.__story} />
			<SpeedometerHud cart={cart} __story={props.__story} />
		</Fragment>
	)
}
export const CartLisener = new Signal<
	(cart: CartClientComponent | undefined) => void
>()
