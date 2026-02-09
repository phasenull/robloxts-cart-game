import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps, Number } from "@rbxts/ui-labs"
import { App } from "client/ui/App"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import PopGui from "client/ui/components/pop-gui"
import { RadialProgress } from "client/ui/components/radial-progress"
import Sidebar from "client/ui/gui/sidebar"

const controls = {
	Progress: Number(0.3, 0, 1, 0.01),
	Color: new Color3(1, 0, 0),
	DegreesPerSecond: Number(360, 0, 720, 60)
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<RadialProgress
				progress={props.controls.Progress}
				degrees_per_second={props.controls.DegreesPerSecond}
				Size={new UDim2(0, 100, 0, 100)}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Color={props.controls.Color}
			/>
		)
	}
}

export = story
