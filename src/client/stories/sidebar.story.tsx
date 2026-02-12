import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { Choose, InferFusionProps } from "@rbxts/ui-labs"
import { CartProvider } from "client/ui/contexts/cart.context"
import { CheckpointProvider } from "client/ui/gui/cart/hooks/useCheckpoint"
import Sidebar from "client/ui/gui/sidebar"

const controls = {
	mock_state: Choose(["none", "alive", "death_screen", "reviving"])
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return <CheckpointProvider>
			<CartProvider __story={{mock_state: props.controls.mock_state}}>
				<Sidebar />
			</CartProvider>
		</CheckpointProvider>
	}
}

export = story
