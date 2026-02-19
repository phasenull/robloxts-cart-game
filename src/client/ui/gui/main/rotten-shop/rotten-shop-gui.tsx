import React, { useRef, useEffect } from "@rbxts/react"
import { PurchasableContainer } from "client/ui/components/purchasable-container"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { purchasables } from "shared/purchasables"
import { RottenShopList } from "./rotten-shop-list"
import { UIHelper } from "client/ui.helper"

export function RottenShopGui() {
	const { closeAll } = useNavigator()
	const closeButtonRef = useRef<ImageButton>()

	useEffect(() => {
		const button = closeButtonRef.current
		if (button) {
			UIHelper.bind(button, 5)
			return () => {
				UIHelper.unbind(button)
			}
		}
	}, [])

	return (
		<frame
			key="RottenShop"
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			Position={new UDim2(0.5, 0, 0.5, 0)}
			Size={new UDim2(1, 0, 1, 0)}
		>
			<uiaspectratioconstraint
				AspectRatio={1.301}
				AspectType={Enum.AspectType.ScaleWithParentSize}
				DominantAxis={Enum.DominantAxis.Height}
			/>
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
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0, 0, 0, 0)}
				Size={new UDim2(1, 0, 0.10400000000000001, 0)}
			>
				<uistroke Thickness={5} />
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(0, 128, 255)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(148, 215, 248))
						])
					}
					Rotation={-90}
				/>
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
					Position={new UDim2(0.058, 0, 0.177, 0)}
					Size={new UDim2(0.157, 0, 0.636, 0)}
					Text="Shop"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					ZIndex={5}
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
				<imagebutton
					key="Close"
					ref={closeButtonRef}
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BorderSizePixel={0}
					Position={new UDim2(0.96, 0, 0.5, 0)}
					ScaleType={Enum.ScaleType.Fit}
					Size={new UDim2(1, 0, 1, 0)}
					Event={{
						MouseButton1Click: () => closeAll()
					}}
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
					<uistroke Thickness={5.1000000000000005} />
					<uiaspectratioconstraint />
					<frame
						key="Bottom"
						BackgroundColor3={Color3.fromRGB(0, 0, 0)}
						BackgroundTransparency={0.4}
						BorderSizePixel={0}
						Position={new UDim2(0, 0, 0.921, 0)}
						Size={new UDim2(1, 0, 0.079, 0)}
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
						Position={new UDim2(0.5, 0, 0.5, 0)}
						Size={new UDim2(0.878, 0, 0.877, 0)}
						Text="X"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
						ZIndex={4}
					>
						<uistroke Thickness={3} />
					</textlabel>
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
				</imagebutton>
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
					Position={new UDim2(0.5, 0, 0.461, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.921, 0)}
					SliceCenter={new Rect(256, 256, 256, 256)}
					TileSize={new UDim2(0, 50, 0, 50)}
					ZIndex={9}
				/>
			</frame>
			<scrollingframe
				Active={true}
				BackgroundTransparency={1}
				CanvasSize={new UDim2(0, 0, 0, 0)}
				AutomaticCanvasSize={Enum.AutomaticSize.Y}
				Position={new UDim2(0, 0, 0.134, 0)}
				ScrollBarImageColor3={Color3.fromRGB(0, 0, 0)}
				ScrollBarThickness={8}
				Size={new UDim2(1, 0, 0.866, 0)}
				ScrollingDirection={Enum.ScrollingDirection.Y}
				BorderSizePixel={0}
				ClipsDescendants={true}
			>
				<uilistlayout
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					Padding={new UDim(0.01, 0)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				<uipadding
					PaddingLeft={new UDim(0, 10)}
					PaddingRight={new UDim(0, 10)}
				/>
				<RottenShopList />
			</scrollingframe>
		</frame>
	)
}
