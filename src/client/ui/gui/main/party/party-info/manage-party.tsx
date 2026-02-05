import React, { Fragment, useState } from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { Players } from "@rbxts/services"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { GoofyText } from "client/ui/components/goofy-text"
import { PRIMARY, UIDIM } from "client/ui/constants"
import { __UNSAFE_SET_PARTY, useParty } from "client/ui/contexts/party.context"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { A } from "shared/assets"
import { __IS_EDIT__ } from "shared/config.helper"
import { Logger } from "shared/logger"
import { ClientFunctions } from "shared/network.helper"
import { Party } from "shared/type.helper"
import { UIHelper } from "shared/ui.helper"
const logger = new Logger("ManagePartyContainer")
export function ManagePartyContainer(props: {
	enable_party_size?: boolean
}) {
	const { enable_party_size } = props
	const { party} = useParty()
	const {
		data: matchmakingData,
		isLoading: matchmakingLoading,
		mutate: startMatchmaking,
		err: matchmakingError
	} = useMutation({
		queryKey: ["start-party-matchmaking"],
		mutationFn: async () => {
			if (__IS_EDIT__) {
				task.wait(1)
				return true
			}
			const [result, err] =
				await ClientFunctions.PartyService.startPartyMatchmaking.invokeWithTimeout(
					5000
				)
			if (err || !result) {
				throw `Failed to start party matchmaking: ${err}`
			}
			return result
		}
	})
	const { mutate: changeVisibility } = useMutation({
		queryKey: ["change-party-visibility"],
		mutationFn: async (_is_public: boolean) => {
			if (__IS_EDIT__) {
				const new_result = _is_public
				__UNSAFE_SET_PARTY.Fire({
					...party!,
					is_public: new_result
				})
				return new_result
			}
			const [result, err] =
				await ClientFunctions.PartyService.changeVisibility.invokeWithTimeout(
					5000,
					_is_public
				)
			if (err || result === undefined) {
				throw `Failed to change party visibility: ${err}`
			}
			return result
		}
	})
	const navigator = useNavigator()
	if (!party) {
		navigator.closeAll()
		return
	}
	const am_i_owner = party.owner === Players.LocalPlayer
	return (
		<frame
			Position={new UDim2(0, 0, 0.2, 0)}
			Size={new UDim2(1, 0, 0.5, 0)}
			BackgroundColor3={PRIMARY}
			BorderSizePixel={0}
		>
			<uilistlayout
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				Padding={new UDim(0.03, 0)}
			/>
			<frame Size={new UDim2(1, 0, 0.2, 0)} BackgroundTransparency={1}>
				<GoofyText
					TextXAlignment={Enum.TextXAlignment.Left}
					Size={new UDim2(0.5, 0, 0.8, 0)}
					Position={UIDIM.LEFT}
					AnchorPoint={UIDIM.A_LEFT}
					Ratio={2}
					Text={`${party.players.size()}/${party.max_players}`}
				/>
				{props.enable_party_size ? (
					<Fragment>
						<GoofyButton
							Size={new UDim2(0.5, 0, 1, 0)}
							Image={A.icons.minus}
							AnchorPoint={UIDIM.A_TOP_RIGHT}
							Position={new UDim2(0.7, 0, 0, 0)}
							Text=""
							OnClick={() => {}}
							Ratio={1}
						/>
						<GoofyText
							TextXAlignment={Enum.TextXAlignment.Center}
							TextYAlignment={Enum.TextYAlignment.Center}
							BackgroundColor3={PRIMARY}
							BackgroundTransparency={0}
							Size={new UDim2(1, 0, 1, 0)}
							Ratio={1}
							Position={new UDim2(0.7, 0, 0, 0)}
							Text={`${party.max_players}`}
						/>
						<GoofyButton
							Size={new UDim2(0.5, 0, 1, 0)}
							Image={A.icons.plus}
							AnchorPoint={UIDIM.A_TOP_RIGHT}
							Position={UIDIM.TOP_RIGHT}
							Text=""
							Ratio={1}
							OnClick={() => {}}
						/>
					</Fragment>
				) : undefined}
			</frame>
			<frame Size={new UDim2(1, 0, 0.2, 0)} BackgroundTransparency={1}>
				<GoofyText
					TextXAlignment={Enum.TextXAlignment.Left}
					Size={new UDim2(0.5, 0, 0.8, 0)}
					Position={UIDIM.LEFT}
					AnchorPoint={UIDIM.A_LEFT}
					Ratio={4}
					RichText
					Text={`<font color="rgb(${party.is_public ? "0,255,0" : "255,0,0"})">${party.is_public ? "Public" : "Private"}</font> Party`}
				/>
				{am_i_owner ? (
					<GoofyButton
						Size={new UDim2(0.5, 0, 1, 0)}
						AnchorPoint={UIDIM.A_TOP_RIGHT}
						Position={UIDIM.TOP_RIGHT}
						Text="CHANGE"
						OnClick={() => {
							changeVisibility(!party.is_public)
						}}
					/>
				) : undefined}
			</frame>
			<frame Size={new UDim2(1, 0, 0.3, 0)} BackgroundTransparency={1} />
			{am_i_owner ? (
				<GoofyButton
					Position={new UDim2(0.5, 0, 1, 0)}
					AnchorPoint={UIDIM.A_BOTTOM}
					Text={matchmakingLoading ? "LOADING" : "START"}
					BackgroundImage={A.ui.halftone6}
					CanvasClipping
					Color={
						matchmakingLoading
							? new Color3(0.3, 0.3, 0.3)
							: new Color3(0, 0.6, 0)
					}
					OnClick={() => {
						if (matchmakingLoading) return UIHelper.playSound(A.sounds.error)
						startMatchmaking()
					}}
				>
					<imagelabel
						Image={A.ui.checkboard}
						ScaleType={Enum.ScaleType.Tile}
						TileSize={new UDim2(0, 200, 0, 200)}
						Size={new UDim2(1, 0, 1.3, 0)}
						AnchorPoint={UIDIM.A_CENTER}
						ImageTransparency={0.8}
						Position={UIDIM.CENTER}
						BackgroundTransparency={1}
						Rotation={-13}
					>
						{/* <uigradient Transparency={new NumberSequence(0.2, 0.9)} /> */}
					</imagelabel>
				</GoofyButton>
			) : undefined}
			<uipadding
				PaddingLeft={new UDim(0.05, 0)}
				PaddingTop={new UDim(0.1, 0)}
				PaddingRight={new UDim(0.05, 0)}
			/>
		</frame>
	)
}
