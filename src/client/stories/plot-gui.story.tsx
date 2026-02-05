import React from "@rbxts/react"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps } from "@rbxts/ui-labs"
import PopGui from "client/ui/components/pop-gui"
import { PlotGui } from "client/ui/gui/main/plot-gui"

const controls = {}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<QueryClientProvider value={new QueryClient({})}>
				<PopGui Visible id={"plot"}>
					<PlotGui />
				</PopGui>
			</QueryClientProvider>
		)
	}
}

export = story
