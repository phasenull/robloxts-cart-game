import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { Choose, InferFusionProps, Number } from "@rbxts/ui-labs"
import { RightSidebar } from "client/ui/components/right-sidebar"
import { CartProvider } from "client/ui/contexts/cart.context"
import { CheckpointProvider } from "client/ui/gui/cart/hooks/useCheckpoint"

const controls = {
	mock_state: Choose(["none", "alive", "death_screen", "reviving"]),
	checkpointIndex: Number(0,0,10,1)
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<CheckpointProvider __story={{mock_checkpoint: props.controls.checkpointIndex}}>
				<CartProvider __story={{ mock_state: props.controls.mock_state}}>
					<RightSidebar />
				</CartProvider>
			</CheckpointProvider>
		)
	}
}

export = story
