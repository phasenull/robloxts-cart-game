import React, { useEffect, useState } from "@rbxts/react"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import ReactRoblox from "@rbxts/react-roblox"
import { Players } from "@rbxts/services"
import { InferFusionProps, Number } from "@rbxts/ui-labs"
import PopGui from "client/ui/components/pop-gui"
import { PartyGui } from "client/ui/gui/main/party/party-gui"
import { PartyPlayerContainer } from "client/ui/gui/main/party/components/party-player-container"
import { PartyMaker } from "client/ui/gui/main/party/party-maker"

const controls = {
	party_amount: Number(2,0,200,1,true),
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {

		return (
			<QueryClientProvider value={new QueryClient({})}>
				<PopGui Visible id={"party"}>
					<PartyMaker
						__story={{
							party_amount: props.controls.party_amount,
						}}
					/>
				</PopGui>
			</QueryClientProvider>
		)
	}
}

export = story
