import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps } from "@rbxts/ui-labs"
import { App } from "client/ui/App"
import PopGui from "client/common/ui/components/pop-gui"
import Sidebar from "client/ui/gui/sidebar"

const controls = {
	
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return <PopGui id="settings"/>
	}
}

export = story
