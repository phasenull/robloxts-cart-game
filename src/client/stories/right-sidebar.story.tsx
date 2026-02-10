import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps } from "@rbxts/ui-labs"
import { RightSidebar } from "client/ui/components/right-sidebar"
import Sidebar from "client/ui/gui/sidebar"

const controls = {
	
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return <RightSidebar/>
	}
}

export = story
