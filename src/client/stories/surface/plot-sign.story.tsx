import React from "@rbxts/react"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps, Slider } from "@rbxts/ui-labs"
import { App } from "client/ui/App"
import { GUI_KEYS } from "client/ui/constants"
import Sidebar from "client/ui/gui/sidebar"
import { PlotSign } from "client/ui/gui/surface/plot-sign"

const controls = {
	owner_id: 1,
	rebirths: Slider(0, 0, 107, 1)
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return <QueryClientProvider value={new QueryClient({})}>
			<PlotSign
				owner_id={props.controls.owner_id}
				rebirths={props.controls.rebirths}
			/>
		</QueryClientProvider>
	}
}

export = story
