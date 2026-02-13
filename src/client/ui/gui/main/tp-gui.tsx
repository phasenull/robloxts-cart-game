import React, { useEffect } from "@rbxts/react"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { UIDIM } from "client/ui/constants"
import { useCheckpoint } from "../cart/hooks/useCheckpoint"
import { A } from "shared/assets"
import Object from "@rbxts/object-utils"
import { useMutation, useQuery } from "@rbxts/react-query"
import { ClientFunctions } from "shared/network.helper"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { UIHelper } from "client/ui.helper"
import { Dependency } from "@flamework/core"
import { CartController } from "client/controllers/cart.controller"
import { useCart } from "client/ui/contexts/cart.context"
import { getCheckpointDataFromIndex, ISLAND_CONFIG } from "shared/cart.helper"

export function TPGui() {
	const { collectedCheckpoints, refresh } = useCheckpoint()
	const navigator = useNavigator()
	useQuery({
		queryKey: ["tpCheckpointState"],
		queryFn: async () => {
			if (__IS_EDIT__) {
				return true
			}
			await refresh()
			return true
		},
		enabled: !__IS_EDIT__
	})
	return (
		<frame
			key="Teleport"
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			ClipsDescendants={false}
			Position={new UDim2(0.5, 0, 0.5, 0)}
			Size={new UDim2(1.3, 0, 1.3, 0)}
		>
			<uiaspectratioconstraint AspectRatio={0.9} />
			<uistroke Thickness={5} />
			<uigradient
				Rotation={90}
				Transparency={
					new NumberSequence([
						new NumberSequenceKeypoint(0, 0.6, 0),
						new NumberSequenceKeypoint(1, 0.256, 0)
					])
				}
			/>
			<imagelabel
				key="Shadow"
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.84}
				Position={new UDim2(0, 0, 0, 0)}
				Size={new UDim2(1, 0, 1, 0)}
			/>
			<scrollingframe
				Active={true}
				AutomaticCanvasSize={Enum.AutomaticSize.Y}
				BackgroundTransparency={1}
				CanvasSize={new UDim2(0, 0, 0, 0)}
				Position={new UDim2(0.025, 0, 0.1, 0)}
				ScrollBarImageColor3={Color3.fromRGB(0, 0, 0)}
				ScrollBarThickness={8}
				BorderSizePixel={0}
				ScrollingDirection={Enum.ScrollingDirection.Y}
				Size={new UDim2(0.95, 0, 0.9, 0)}
			>
				<uipadding
					PaddingRight={new UDim(0, 14)}
					PaddingLeft={new UDim(0, 5)}
					PaddingTop={new UDim(0, 5)}
					PaddingBottom={new UDim(0, 5)}
				/>
				{Object.keys(ISLAND_CONFIG).map((checkpoint_index) => (
					<CheckpointEntry
						key={`tp-${checkpoint_index}`}
						checkpoint_index={tonumber(checkpoint_index) as number}
						is_locked={
							!collectedCheckpoints.includes(
								tonumber(checkpoint_index) as number
							)
						}
					/>
				))}

				<uigridlayout
					CellPadding={new UDim2(0, 0, 0.05, 0)}
					CellSize={new UDim2(1, 0, 1, 0)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				>
					<uiaspectratioconstraint AspectRatio={4} />
				</uigridlayout>
			</scrollingframe>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(-0.025, 0, 0, 0)}
				Size={new UDim2(1.05, 0, 0.10400000000000001, 0)}
				ClipsDescendants={false}
			>
				<uistroke Thickness={5} />
				<frame
					key="Bottom"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.921, 0)}
					Size={new UDim2(1, 0, 0.079, 0)}
				/>
				<textlabel
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.105, 0, 0.177, 0)}
					Size={new UDim2(0.157, 0, 0.636, 0)}
					Text="Teleport"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke Thickness={3} />
					<uiaspectratioconstraint
						AspectRatio={3.25}
						AspectType={Enum.AspectType.ScaleWithParentSize}
						DominantAxis={Enum.DominantAxis.Height}
					/>
				</textlabel>
				<imagelabel
					BackgroundTransparency={1}
					Image="rbxassetid://120415569212086"
					Position={new UDim2(0.009000000000000001, 0, 0.108, 0)}
					Size={new UDim2(0.058, 0, 0.771, 0)}
				>
					<uiaspectratioconstraint
						AspectType={Enum.AspectType.ScaleWithParentSize}
						DominantAxis={Enum.DominantAxis.Height}
					/>
				</imagelabel>
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(0, 128, 255)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(148, 215, 248))
						])
					}
					Rotation={-90}
				/>
				<imagelabel
					key="Shadow"
					BackgroundTransparency={1}
					Image="rbxassetid://75600902046326"
					ImageColor3={Color3.fromRGB(0, 0, 0)}
					ImageTransparency={0.84}
					Position={new UDim2(-0.004, 0, -0.078, 0)}
					Size={new UDim2(1.004, 0, 0.9520000000000001, 0)}
					ZIndex={0}
				/>
				<imagelabel
					key="Tile"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://79972921327842"
					ImageTransparency={0.5}
					Position={new UDim2(0.506, 0, 0.446, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.921, 0)}
					SliceCenter={new Rect(256, 256, 256, 256)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<GoofyButton
					AnchorPoint={new Vector2(0.5, 0.5)}
					Position={new UDim2(0.96, 0, 0.5, 0)}
					OnClick={() => {
						navigator.closeAll()
					}}
					Size={new UDim2(1, 0, 1, 0)}
					Text=""
					rotate={0}
					DisablePopEffect
				>
					<uigradient
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, Color3.fromRGB(255, 0, 0)),
								new ColorSequenceKeypoint(1, Color3.fromRGB(249, 54, 106))
							])
						}
						Rotation={-90}
					/>
					<textlabel
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(0.45, 0, 0.5, 0)}
						Size={new UDim2(0.7000000000000001, 0, 0.7000000000000001, 0)}
						Text="X"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<uistroke Thickness={5.1000000000000005} />
					<imagelabel
						key="Tile"
						AnchorPoint={new Vector2(0.5, 0.5)}
						BackgroundTransparency={1}
						Image="rbxassetid://120250412681646"
						ImageTransparency={0.6}
						Position={new UDim2(0.5, 0, 0.461, 0)}
						ScaleType={Enum.ScaleType.Tile}
						Size={new UDim2(1, 0, 0.921, 0)}
						TileSize={new UDim2(0, 50, 0, 50)}
					/>
					<uiaspectratioconstraint />
				</GoofyButton>
			</frame>
		</frame>
	)
}
function CheckpointEntry(props: {
	checkpoint_index: number
	is_locked: boolean
}) {
	const config = getCheckpointDataFromIndex(props.checkpoint_index)
	const navigator = useNavigator()
	const { mutate, isLoading } = useMutation({
		queryKey: [`tpToCheckpoint-${props.checkpoint_index}`],
		mutationFn: async (checkpoint_index: number) => {
			if (props.is_locked) {
				UIHelper.playSound(A.sounds.error)
				return true
			}
			if (__IS_EDIT__) {
				return true
			}
			await ClientFunctions.CheckpointService.tpMeToCheckpoint
				.invokeWithTimeout(5000, checkpoint_index)
				.then((result) => {
					if (!result) {
						print("Failed to tp to checkpoint")
						return
					}
					const [success, err] = result
					if (err || !success) {
						print(`Error tp to checkpoint: ${err}`)
						return
					}
					print(`Successfully tp to checkpoint ${checkpoint_index}`)
					navigator.closeAll()
				})
				.catch((err) => {
					print(`Error tp to checkpoint: ${err}`)
				})
			return true
		}
	})
	if (!config) return
	return (
		<frame
			key="CheckpointEntry"
			LayoutOrder={props.checkpoint_index}
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			Position={new UDim2(0.027, 0, 0.004, 0)}
			Size={new UDim2(1, 0, 1, 0)}
		>
			<RottenButton
				ZIndex={5}
				Position={UIDIM.BOTTOM_RIGHT}
				Size={UIDIM.ONE}
				Text={props.is_locked ? "LOCKED" : "TP"}
				AnchorPoint={new Vector2(0, 0)}
			/>
			<imagelabel
				key="Shadow"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.7000000000000001}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				Size={new UDim2(1.0010000000000001, 0, 1.088, 0)}
				ZIndex={0}
			/>
			<uistroke Thickness={5} />
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://120250412681646"
				ImageTransparency={0.6}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 1, 0)}
				TileSize={new UDim2(0, 75, 0, 75)}
				Visible={false}
			/>
			<imagelabel
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Image={config.image}
				ImageColor3={
					props.is_locked
						? new Color3(0.3, 0.3, 0.3)
						: Color3.fromRGB(255, 255, 255)
				}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Crop}
				Size={new UDim2(1, 0, 1, 0)}
			/>
			<RottenButton
				Position={UIDIM.BOTTOM_RIGHT}
				Size={UDim2.fromScale(0.3, 0.5)}
				Color={
					props.is_locked
						? new Color3(0.29, 0.29, 0.29)
						: new Color3(0.01, 1, 0.34)
				}
				onClick={() => {
					if (isLoading) return
					mutate(props.checkpoint_index)
				}}
				Text={props.is_locked ? "LOCKED" : "TP"}
				AnchorPoint={UIDIM.A_BOTTOM_RIGHT}
			/>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Size={new UDim2(1, 0, 0.24, 0)}
				ZIndex={5}
			>
				<textlabel
					key="Label"
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.481, 0, 0.481, 0)}
					Size={new UDim2(0.468, 0, 0.782, 0)}
					Text={config.name}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					TextXAlignment={Enum.TextXAlignment.Left}
				>
					<uistroke Thickness={3} />
				</textlabel>
			</frame>
		</frame>
	)
}