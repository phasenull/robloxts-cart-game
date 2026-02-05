import React from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { Players } from "@rbxts/services"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { GoofyText } from "client/ui/components/goofy-text"
import { Icon } from "client/ui/components/icon"
import { LoadingIndicator } from "client/ui/components/loading-indicator"
import { PRIMARY, UIDIM } from "client/ui/constants"
import { A } from "shared/assets"
export function PartyPlayerContainer(props: {
	player: Player
	state: {
		is_owner: boolean
		is_invited: boolean
	}
	show_controls?: boolean
}) {
	const is_me = props.player.Name === Players.LocalPlayer.Name
	const { player, state } = props
	const is_owner = state.is_owner
	const is_invited = is_me ? false : is_owner ? false : state.is_invited
	const text = is_invited ? `${player.Name} (Invited)` : player.Name
	const show_controls = (props.show_controls || state.is_invited) && !is_me
	const tinted_color = PRIMARY.Lerp(new Color3(), 0.3)
	const { data, isLoading, err } = useQuery({
		queryKey: ["party-player-avatar", player.UserId],
		queryFn: async () => {
			const [avatar, success] = Players.GetUserThumbnailAsync(
				player.UserId,
				Enum.ThumbnailType.HeadShot,
				Enum.ThumbnailSize.Size100x100
			)
			if (!success) {
				throw `Failed to get avatar for player ${player.Name}`
			}
			return avatar
		}
	})
	return (
		<frame LayoutOrder={2} Size={new UDim2(1, 0, 0.2, 0)} BackgroundColor3={PRIMARY}>
			
			<imagelabel
				Size={UIDIM.ONE}
				Image={A.ui.player_profile_dashes}
				BackgroundTransparency={1}
				ImageTransparency={is_invited ? 0.8 : 1}
				ZIndex={2}
			/>
			<uiaspectratioconstraint AspectRatio={7} />
				<uicorner CornerRadius={new UDim(0.3, 0)} />
			<uistroke
				Color={is_me ? new Color3(1, 1, 1) : tinted_color}
				BorderStrokePosition={Enum.BorderStrokePosition.Inner}
				Thickness={0.1}
				StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
			/>
			<frame
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundTransparency={1}
				BackgroundColor3={PRIMARY}
			>
				<uipadding
					PaddingLeft={new UDim(0.02, 0)}
					PaddingRight={new UDim(0.02, 0)}
				/>
				{/* left container */}
				<imagelabel
					Image={data}
					BorderSizePixel={0}
					BackgroundColor3={is_me ? new Color3(1, 1, 1) : tinted_color}
					Size={UIDIM.ONE}
					Position={new UDim2(-0.02, 0, 0, 0)}
				>
					{state.is_owner ? (
						<Icon
							Image={A.icons.diamond}
							Size={new UDim2(0.6, 0, 0.6, 0)}
							AnchorPoint={new Vector2(0.5, 0.5)}
							Position={new UDim2(0.1, 0, 0.1, 0)}
							Rotation={-45}
						/>
					) : undefined}
					{!data || isLoading || err ? (
						<LoadingIndicator Size={UIDIM.ONE} />
					) : undefined}
					<uicorner CornerRadius={new UDim(0.5, 0)} />
					<uiaspectratioconstraint AspectRatio={1} />
				</imagelabel>
				<frame
					Size={new UDim2(show_controls ? 4.5 / 7 : 1, 0, 1, 0)}
					BackgroundTransparency={1}
				>
					{/* avatar */}

					{/* player name */}
					<GoofyText
						TextTransparency={is_invited ? 0.3 : 0}
						Position={new UDim2(1, 0, 0.5, 0)}
						AnchorPoint={new Vector2(1, 0.5)}
						MaxTextSize={120}
						TextXAlignment={Enum.TextXAlignment.Left}
						Text={text}
						Thickness={0.05}
						MinTextSize={1}
						Size={new UDim2(show_controls ? 5 / 7 : 5.71 / 7, 0, 0.5, 0)}
						Italic={is_invited}
					/>
				</frame>

				{/* CONTROLS */}
				{show_controls ? (
					<frame
						BackgroundTransparency={1}
						Size={new UDim2(0.5, 0, 0.8, 0)}
						AnchorPoint={UIDIM.A_RIGHT}
						Position={UIDIM.RIGHT}
					>
						<uiaspectratioconstraint AspectRatio={3} />
						<uigridlayout
							CellSize={new UDim2(1, 0, 1, 0)}
							CellPadding={new UDim2(0.02, 0, 0, 0)}
							FillDirectionMaxCells={1}
							HorizontalAlignment={Enum.HorizontalAlignment.Right}
							FillDirection={Enum.FillDirection.Vertical}
						>
							<uiaspectratioconstraint AspectRatio={1} />
						</uigridlayout>
						{is_invited ? undefined : (
							<GoofyButton
								Ratio={1}
								Size={UIDIM.ONE}
								Image={A.icons.diamond}
								Text=""
								OnClick={() => {}}
							/>
						)}
						<GoofyButton
							Ratio={1}
							Size={UIDIM.ONE}
							Image={A.icons.cross}
							Text=""
							OnClick={() => {}}
						/>
					</frame>
				) : undefined}
			</frame>
		</frame>
	)
}
