import React from "@rbxts/react"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import ReactRoblox from "@rbxts/react-roblox"
import { Players } from "@rbxts/services"
import { InferFusionProps } from "@rbxts/ui-labs"
import PopGui from "client/ui/components/pop-gui"
import { PartyGui } from "client/ui/gui/main/party/party-gui"
import { PartyPlayerContainer } from "client/ui/gui/main/party/components/party-player-container"

const controls = {
	is_party_enabled: true
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<QueryClientProvider value={new QueryClient({})}>
				<PopGui Visible id={"party"}>
					<PartyGui
						__story={{
							party_enabled: props.controls.is_party_enabled
						}}
					/>
				</PopGui>
			</QueryClientProvider>
		)
	}
}

export = story
