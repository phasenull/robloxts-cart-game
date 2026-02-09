import React from "@rbxts/react"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import ReactRoblox from "@rbxts/react-roblox"
import { Choose, InferFusionProps, Number, String } from "@rbxts/ui-labs"
import { CartHud } from "client/ui/gui/cart/cart-hud"
import { CartProvider } from "client/ui/contexts/cart.context"
import { DeathGui } from "client/ui/gui/cart/death-gui"

const controls = {
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<QueryClientProvider value={new QueryClient({})}>
				<CartProvider>
					<DeathGui
					/>
				</CartProvider>
			</QueryClientProvider>
		)
	}
}

export = story
