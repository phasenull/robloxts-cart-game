import React, { useState } from "@rbxts/react"
import { useMutation, useQuery } from "@rbxts/react-query"
import { EmptyContainer } from "client/ui/components/empty-container"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { GoofyText } from "client/ui/components/goofy-text"
import { LoadingIndicator } from "client/ui/components/loading-indicator"
import { getRandomTestingUser, PRIMARY, UIDIM } from "client/ui/constants"
import { __IS_EDIT__ } from "shared/config.helper"
import { ClientFunctions } from "shared/network.helper"
import { Party } from "shared/type.helper"
import { PartyListComponent } from "./components/party-list"
import { A } from "shared/assets"
import { useParty } from "client/ui/contexts/party.context"

export function PartyMaker(props: {
	__story?: { party_amount: number }
}) {
	const { setParty, party } = useParty()
	const { isLoading, mutate } = useMutation({
		queryKey: [`create-party`],
		mutationFn: async () => {
			if (__IS_EDIT__) {
				const data = {
					guid: "STUDIO-PARTY",
					owner: game.GetService("Players").GetPlayers()[0],
					players: game.GetService("Players").GetPlayers(),
					invites: [],
					is_public: true,
					max_players: 2,
					state: "lobby"
				} as Party
				setParty(data)
				return data
			}
			const [success, err] =
				await ClientFunctions.PartyService.createParty.invokeWithTimeout(5000)
			if (err || success === false) {
				throw `Failed to create party: ${err}`
			}
			return success
		}
	})
	const {
		isLoading: isPartiesLoading,
		err,
		data: partiesData
	} = useQuery({
		queryKey: [`parties-list-${props.__story?.party_amount}`],
		queryFn: async () => {
			if (__IS_EDIT__) {
				const parties = []
				for (let i = 0; i < (props.__story?.party_amount ?? math.random(3,10)); i++) {
					parties.push(getRandomTestingUser(math.random(1, 10)))
				}
				return parties.map((party) => ({
					guid: `STUDIO-PARTY-${math.random(1000, 9999)}`,
					owner: party[0],
					players: party,
					invites: [],
					is_public: math.random() > 0.5,
					max_players: math.clamp(party.size()+math.random(0,5),0,10),
					state: "lobby"
				})) as Party[]
			}
			const [parties, err] =
				await ClientFunctions.PartyService.getAvailableParties.invokeWithTimeout(
					5000
				)
			if (err || !parties) {
				throw `Failed to fetch parties: ${err}`
			}
			return parties
		},
		refetchInterval: 2000,
		enabled: party === undefined
	})
	return (
		<EmptyContainer ClipsDescendants={true}>
			<uicorner CornerRadius={new UDim(0.1, 0)} />
			<frame
				BackgroundTransparency={1}
				AnchorPoint={UIDIM.A_TOP}
				Position={UIDIM.TOP_CENTER}
				Size={new UDim2(1, 0, 0.8, 0)}
			>
				{isPartiesLoading && !partiesData ? (
					<LoadingIndicator
						Position={UIDIM.CENTER}
						Size={new UDim2(0.1, 0, 0.1, 0)}
					/>
				) : err ? (
					<GoofyText
						Position={UIDIM.CENTER}
						Size={new UDim2(0.8, 0, 0.2, 0)}
						Text={`Failed to load parties: ${tostring(err)}`}
					/>
				) : partiesData && partiesData.size() === 0 ? (
					<GoofyText
						Position={UIDIM.CENTER}
						Size={new UDim2(0.8, 0, 0.1, 0)}
						AnchorPoint={UIDIM.A_CENTER}
						MaxTextSize={80}
						Text="No parties available."
					/>
				) : (
					<PartyListComponent Parties={partiesData ?? []} />
				)}
				<uipadding
					PaddingTop={new UDim(0.05, 0)}
					PaddingBottom={new UDim(0.05, 0)}
					PaddingLeft={new UDim(0.05, 0)}
					PaddingRight={new UDim(0.05, 0)}
				/>
				<uicorner CornerRadius={new UDim(0.1, 0)} />
			</frame>
			<frame
				BackgroundTransparency={1}
				AnchorPoint={UIDIM.A_BOTTOM_RIGHT}
				Position={UIDIM.BOTTOM_RIGHT}
				Size={new UDim2(.5, 0, 0.2, 0)}
			>
				<uipadding PaddingBottom={new UDim(0.2, 0)} 
					PaddingLeft={new UDim(0.3, 0)}
					PaddingRight={new UDim(0.2, 0)}
				/>
				<GoofyText
					Position={new UDim2(0, 0, 0.5, 0)}
					AnchorPoint={UIDIM.A_LEFT}
					Size={new UDim2(0.1, 0, 1, 0)}
					Text="or"
				/>
				<GoofyButton
				Color={new Color3(1,0.8,0.14)}
					CanvasClipping
					AnchorPoint={UIDIM.A_RIGHT}
					Position={new UDim2(1, 0, 0.5, 0)}
					Size={new UDim2(1, 0, 1, 0)}
					Text={isLoading ? "Creating..." : "Create Party"}
					OnClick={() => {
						mutate()
					}}
				/>
			</frame>

			<imagelabel
				BackgroundColor3={PRIMARY}
				ImageTransparency={0.8}
				BorderSizePixel={0}
				ScaleType={Enum.ScaleType.Crop}
				Size={UIDIM.ONE}
				Image={A.ui.halftone_bottom_top}
				ZIndex={-1}
			>
				<uicorner CornerRadius={new UDim(0.1, 0)} />
			</imagelabel>
		</EmptyContainer>
	)
}
