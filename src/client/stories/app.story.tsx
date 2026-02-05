import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps } from "@rbxts/ui-labs"
import { App } from "client/ui/App"
import { GUI_KEYS } from "client/ui/constants"

const controls = {
	initial_gui: "party" as GUI_KEYS,
	cart_enabled: false,
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return <App initial_gui={props.controls.initial_gui} cart_enabled={props.controls.cart_enabled} />
	}
}

export = story
