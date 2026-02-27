import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps } from "@rbxts/ui-labs"
import { App } from "client/ui/App"
import { GoofyButton } from "@common/client/ui/components/buttons/goofy-button"
import { RottenButton } from "@common/client/ui/components/buttons/rotten-button"
import PopGui from "@common/client/ui/components/pop-gui"
import Sidebar from "client/ui/gui/sidebar"

const controls = {
	Text: "Click me!",
	Color: new Color3(1,0,0),
	Ratio:2
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<RottenButton
				Text={props.controls.Text}
				Color={props.controls.Color}
				onClick={() => print("Hey!")}
				Ratio={props.controls.Ratio}
			/>
		)
	}
}

export = story
