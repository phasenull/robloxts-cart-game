import React from "@rbxts/react"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import ReactRoblox from "@rbxts/react-roblox"
import { Choose, InferFusionProps, Number, String } from "@rbxts/ui-labs"
import { CartHud } from "client/ui/gui/cart/cart-hud"

const controls = {
	cart_enabled: true,
	override_speed: Number(40, 0, 300, 10),
	override_brake: false,
	override_device: Choose([ "Keyboard","Gamepad", "Mobile"])
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<QueryClientProvider value={new QueryClient({})}>
				<CartHud
					__story={{
						cart_enabled: props.controls.cart_enabled,
						override_brake: props.controls.override_brake,
						override_speed: props.controls.override_speed,
						override_device: props.controls.override_device
					}}
				/>
			</QueryClientProvider>
		)
	}
}

export = story
