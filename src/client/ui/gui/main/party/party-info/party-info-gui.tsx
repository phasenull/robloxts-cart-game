import React, { Fragment, useState } from "@rbxts/react"
import { Players } from "@rbxts/services"
import { EmptyContainer } from "client/ui/components/empty-container"
import { GoofyText } from "client/ui/components/goofy-text"
import {
	__STUDIO__,
	getRandomTestingUser,
	PRIMARY,
	TESTING_USERS,
	UIDIM
} from "client/ui/constants"
import { Party } from "shared/type.helper"
import { PartyPlayerContainer } from "../components/party-player-container"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { A } from "shared/assets"
import { useMutation } from "@rbxts/react-query"
import { ClientFunctions } from "shared/network.helper"
import { ManagePartyContainer } from "./manage-party"
import { __UNSAFE_SET_PARTY, useParty } from "client/ui/contexts/party.context"

export function PartyInfo(props: { enable_party_size?: boolean }) {
	const { setParty, party } = useParty()
	const { mutate: leaveParty } = useMutation({
		queryKey: ["leave-party"],
		mutationFn: async () => {
			if (__IS_EDIT__) {
				__UNSAFE_SET_PARTY.Fire(undefined)
				return true
			}
			const [result, err] =
				await ClientFunctions.PartyService.leaveParty.invokeWithTimeout(5000)
			if (err || !result) {
				throw `Failed to leave party: ${err}`
			}
			return result
		}
	})
	if (!party) {
		return
	}
	const am_i_owner = party.owner === Players.LocalPlayer
	let players = [...party.players, ...party.invites]
	players = players.sort((a, b) => {
		// en üst ben
		// altta invite'lar
		// kalan rastgele
		if (a === Players.LocalPlayer) return true
		if (b === Players.LocalPlayer) return false
		const is_a_invited = party.invites.includes(a)
		const is_b_invited = party.invites.includes(b)
		if (is_a_invited && !is_b_invited) return true
		if (!is_a_invited && is_b_invited) return false
		if (a.Name === party.owner.Name && b.Name !== party.owner.Name) return true
		if (b.Name === party.owner.Name && a.Name !== party.owner.Name) return false
		return false
	})

	return (
		<EmptyContainer ClipsDescendants>
			<frame Size={new UDim2(0.35, 0, 1, 0)} BackgroundTransparency={1}>
				<uipadding
					PaddingLeft={new UDim(0.05, 0)}
					PaddingTop={new UDim(0.1, 0)}
					PaddingRight={new UDim(0.05, 0)}
					PaddingBottom={new UDim(0.1, 0)}
				/>
				<GoofyText
					Size={new UDim2(1, 0, 1, 0)}
					Ratio={5}
					Text={`${party.owner.Name}'s Party`}
				/>

				{/* party data frame */}
				<ManagePartyContainer />
				<GoofyButton
				CanvasClipping
					Size={new UDim2(0.3, 0, 0.1, 0)}
					Position={new UDim2(0.5, 0, 1, 0)}
					AnchorPoint={UIDIM.A_BOTTOM}
					Color={new Color3(0.8, 0, 0)}
					Text="LEAVE"
					OnClick={() => {
						leaveParty()
					}}
				>
					<uigradient
						Color={new ColorSequence(new Color3(1, 1, 1))}
						Transparency={new NumberSequence(0.2, 0.9)}
					/>
					<imagelabel
						Image={A.icons.cross}
						ScaleType={Enum.ScaleType.Tile}
						TileSize={new UDim2(0, 20, 0, 20)}
						Size={new UDim2(1, 0, 1.3, 0)}
						AnchorPoint={UIDIM.A_CENTER}
						ImageColor3={new Color3()}
						ImageTransparency={0.8}
						Position={UIDIM.CENTER}
						BackgroundTransparency={1}
						Rotation={-13}
					/>
				</GoofyButton>
			</frame>

			{/* player containers */}
			<scrollingframe
				ClipsDescendants={true}
				Size={new UDim2(0.6, 0, 0.95, 0)}
				Position={new UDim2(0.95, 0, 0.5, 0)}
				AnchorPoint={UIDIM.A_RIGHT}
				AutomaticCanvasSize={Enum.AutomaticSize.Y}
				CanvasSize={UIDIM.ZERO}
				ScrollingDirection={Enum.ScrollingDirection.Y}
				BackgroundTransparency={1}
				ScrollBarThickness={0}
				ScrollBarImageColor3={PRIMARY}
			>
				<uigridlayout
					CellSize={new UDim2(0.98, 0, 1, 0)}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
				>
					<uiaspectratioconstraint AspectRatio={7} DominantAxis={"Width"} />
				</uigridlayout>
				{players.map((player, index) => {
					return (
						<PartyPlayerContainer
							key={index}
							player={player}
							state={{
								is_invited: party.invites.includes(player),
								is_owner: player === party.owner
							}}
							show_controls={am_i_owner}
						/>
					)
				})}
			</scrollingframe>
		</EmptyContainer>
	)
}
