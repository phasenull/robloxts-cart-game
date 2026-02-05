import React, { Fragment } from "@rbxts/react"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import ReactRoblox from "@rbxts/react-roblox"
import { Players } from "@rbxts/services"
import { InferFusionProps } from "@rbxts/ui-labs"
import { PartyPlayerContainer } from "client/ui/gui/main/party/components/party-player-container"

const controls = {
	player_name: "phasenull_dev",
	is_owner: false,
	is_invited: false,
	show_controls: false
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		const player_id = Players.GetUserIdFromNameAsync(props.controls.player_name)
		return (
			<Fragment>
				<QueryClientProvider
					key={"party_player_container"}
					value={new QueryClient({})}
				>
					<PartyPlayerContainer
						player={
							{ Name: props.controls.player_name, UserId: player_id } as Player
						}
						show_controls={props.controls.show_controls}
						state={{
							is_owner: props.controls.is_owner,
							is_invited: props.controls.is_invited
						}}
					/>
				</QueryClientProvider>
			</Fragment>
		)
	}
}

export = story
