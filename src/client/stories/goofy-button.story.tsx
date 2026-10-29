import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps } from "@rbxts/ui-labs"
import { App } from "client/ui/App"
import { GoofyButton } from "client/common/ui/components/buttons/goofy-button"
import PopGui from "client/common/ui/components/pop-gui"
import Sidebar from "client/ui/gui/sidebar"

const controls = {
	Text: "Click me!"
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return <GoofyButton Text="Click me!" OnClick={() => print("Goof!")} />
	}
}

export = story
