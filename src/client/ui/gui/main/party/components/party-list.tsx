import React from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { GoofyText } from "client/ui/components/goofy-text"
import { Icon } from "client/ui/components/icon"
import { PlayerAvatar } from "client/ui/components/player-avatar"
import { PRIMARY, UIDIM } from "client/ui/constants"
import { __UNSAFE_SET_PARTY, useParty } from "client/ui/contexts/party.context"
import { A } from "shared/assets"
import { __IS_EDIT__ } from "shared/config.helper"
import { ClientFunctions } from "shared/network.helper"
import { Party } from "shared/type.helper"
import { UIHelper } from "shared/ui.helper"
import { arrayOf } from "shared/util.helper"

export function PartyListComponent(props: { Parties: Party[] }) {
	const { setParty } = useParty()
	const { mutate, isLoading } = useMutation({
		queryKey: [`join-party`],
		mutationFn: async (party_guid: string) => {
			if (__IS_EDIT__) {
				task.wait(1)
				__UNSAFE_SET_PARTY.Fire(
					props.Parties.find((p) => p.guid === party_guid)
				)
				return true
			}
			const [success, err] =
				await ClientFunctions.PartyService.joinParty.invokeWithTimeout(
					5000,
					party_guid
				)
			if (err || success === false) {
				throw `Failed to join party: ${err}`
			}
			return success
		}
	})
	const coal_color = new Color3(0.2, 0.2, 0.2)
	return (
		<scrollingframe
			Size={UIDIM.ONE}
			AutomaticCanvasSize={"Y"}
			ScrollBarThickness={4}
			BackgroundTransparency={1}
			BorderSizePixel={0}
			CanvasSize={UIDIM.ZERO}
			ZIndex={2}
		>
			<uigridlayout
				CellSize={new UDim2(0.49, 0, 1, 0)}
				CellPadding={new UDim2(0.01, 0, 0.01, 0)}
				SortOrder={Enum.SortOrder.LayoutOrder}
			>
				<uiaspectratioconstraint AspectRatio={5} />
			</uigridlayout>
			{props.Parties.map((party) => {
				return (
					<frame
						Size={new UDim2(1, 0, 0, 50)}
						BorderSizePixel={0}
						BackgroundColor3={new Color3(1, 1, 1)}
						LayoutOrder={party.players.size() === party.max_players ? 2 : 1}
					>
						<uipadding
							PaddingTop={new UDim(0.05, 0)}
							PaddingBottom={new UDim(0.05, 0)}
							PaddingLeft={new UDim(0.02, 0)}
							PaddingRight={new UDim(0.02, 0)}
						/>
						<uicorner CornerRadius={new UDim(0.2, 0)} />
						<uigradient
							Color={
								new ColorSequence([
									new ColorSequenceKeypoint(0, new Color3(1, 1, 1)),
									new ColorSequenceKeypoint(1, new Color3(0.86, 0.92, 0.98))
								])
							}
							Rotation={90}
						/>
						<frame
							Size={new UDim2(0.55, 0, 1, 0)}
							AnchorPoint={UIDIM.A_TOP_LEFT}
							BackgroundTransparency={1}
							Position={new UDim2(0.35, 0, 0, 0)}
						>
							<uiaspectratioconstraint AspectRatio={2.5} />
							<uigridlayout
								SortOrder={Enum.SortOrder.LayoutOrder}
								CellPadding={new UDim2(0.02, 0, 0.05, 0)}
								CellSize={new UDim2(0.182, 0, 1, 0)}
							>
								<uiaspectratioconstraint AspectRatio={1} />
							</uigridlayout>

							{party.players.map((player) => (
								<PlayerAvatar
									LayoutOrder={1}
									user_id={player.UserId}
									BackgroundTransparency={0.8}
									BackgroundColor3={new Color3(0, 0, 0)}
									Size={UIDIM.ONE}
								>
									<uicorner CornerRadius={new UDim(1, 0)} />
								</PlayerAvatar>
							))}
							{arrayOf(party.max_players - party.players.size(), true).map(
								() => (
									<imagelabel
										Image={A.icons.plus}
										ImageTransparency={0.5}
										LayoutOrder={5}
										BackgroundTransparency={0.8}
										Size={UIDIM.ONE}
										BackgroundColor3={new Color3(0, 0, 0)}
									>
										<uicorner CornerRadius={new UDim(1, 0)} />
									</imagelabel>
								)
							)}
						</frame>
						<GoofyText
							Size={new UDim2(0.3, 0, 1, 0)}
							Position={new UDim2(0, 0, 0, 0)}
							Ratio={4}
							Thickness={0}
							TextColor3={new Color3(0.2, 0.2, 0.2)}
							Text={`${party.owner.Name}'s Party`}
						/>
						<GoofyText
							Size={new UDim2(0.3, 0, 1, 0)}
							Position={new UDim2(0, 0, 0.5, 0)}
							Ratio={4}
							Thickness={0}
							TextColor3={coal_color}
							BackgroundColor3={new Color3(0, 0, 0)}
							BackgroundTransparency={0.8}
							BorderSizePixel={0}
							Text={`${party.players.size()}/${party.max_players}`}
						>
							<uicorner CornerRadius={new UDim(0.3, 0)} />
						</GoofyText>
						<GoofyButton
							OnClick={() => {
								if (isLoading) {
									UIHelper.playSound(A.sounds.error)
									return
								}
								mutate(party.guid)
							}}
							Text="JOIN"
							Ratio={1}
							TextSize={new UDim2(1, 0, 0.4, 0)}
							Size={new UDim2(0.7, 0, 0.7, 0)}
							AnchorPoint={UIDIM.A_RIGHT}
							Position={new UDim2(1, 0, 0.5, 0)}
							CanvasClipping
							Color={
								isLoading ? new Color3(0.2, 0.2, 0.2) : new Color3(0, 0.67, 0)
							}
						/>
						{/* <imagelabel
							ZIndex={-1}
							BackgroundColor3={PRIMARY}
							ImageTransparency={0}
							BorderSizePixel={0}
							Rotation={90}
							ScaleType={Enum.ScaleType.Fit}
							Size={new UDim2(1, 0, 5, 0)}
							Image={A.ui.halftone_circle}
						>
							<uicorner CornerRadius={new UDim(0.1, 0)} />
						</imagelabel> */}
					</frame>
				)
			})}
		</scrollingframe>
	)
}
