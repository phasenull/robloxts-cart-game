import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps, Number } from "@rbxts/ui-labs"
import { App } from "client/ui/App"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import PopGui from "client/ui/components/pop-gui"
import { ProgressBarComponent } from "client/ui/components/progressbar-component"
import { RadialProgress } from "client/ui/components/radial-progress"
import Sidebar from "client/ui/gui/sidebar"

const controls = {
	Progress: Number(0.3, 0, 1, 0.01),
	Color: new Color3(1, 0, 0),
	Text:"Hi <3",
	TotalDuration: Number(1,0,1200,1)
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<ProgressBarComponent
				progress={props.controls.Progress}
				total_duration={props.controls.TotalDuration}
				Text={props.controls.Text}
				Color={props.controls.Color}
			/>
		)
	}
}

export = story
