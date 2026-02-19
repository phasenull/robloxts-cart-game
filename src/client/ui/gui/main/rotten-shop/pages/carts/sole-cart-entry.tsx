import React, { useRef, useEffect } from "@rbxts/react"
import { UIHelper } from "client/ui.helper"

interface SoleCartEntryProps {
	cartName: string
	description: string
	price: string
	backgroundImage?: string
	backgroundImageColor?: Color3
	layoutOrder?: number
	onClick?: () => void
	onBuyClick?: () => void
}

export function SoleCartEntry({
	cartName,
	description,
	price,
	backgroundImage = "rbxassetid://119921518737471",
	backgroundImageColor = Color3.fromRGB(147, 201, 255),
	layoutOrder,
	onClick,
	onBuyClick
}: SoleCartEntryProps) {
	const entryButtonRef = useRef<ImageButton>()
	const buyButtonRef = useRef<ImageButton>()

	useEffect(() => {
		const entryButton = entryButtonRef.current
		const buyButton = buyButtonRef.current

		if (entryButton) {
			UIHelper.bind(entryButton, 2)
		}
		if (buyButton) {
			UIHelper.bind(buyButton, 3)
		}

		return () => {
			if (entryButton) UIHelper.unbind(entryButton)
			if (buyButton) UIHelper.unbind(buyButton)
		}
	}, [])

	return (
		<imagebutton
			ref={entryButtonRef}
			key="SoleCartEntry"
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			LayoutOrder={layoutOrder}
			Position={new UDim2(0.015, 0, 0.073, 0)}
			Size={new UDim2(0.31, 0, 0.927, 0)}
			Event={{
				MouseButton1Click: onClick
			}}
		>
			<uistroke Thickness={5} />
			<imagelabel
				key="Shadow"
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.84}
				Size={new UDim2(1, 0, 1, 0)}
				ZIndex={0}
			/>
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://120250412681646"
				ImageTransparency={0.7000000000000001}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 1, 0)}
				TileSize={new UDim2(0, 50, 0, 50)}
				ZIndex={0}
			/>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Size={new UDim2(1, 0, 0.091, 0)}
				ZIndex={5}
			>
				<textlabel
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
					Position={new UDim2(0.913, 0, 0.5, 0)}
					Size={new UDim2(0.8260000000000001, 0, 0.782, 0)}
					Text={cartName}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke Thickness={3} />
				</textlabel>
			</frame>
			<imagebutton
				ref={buyButtonRef}
				key="Buy"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.045, 0, 0.836, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.891, 0, 0.138, 0)}
				ZIndex={45}
				Event={{
					MouseButton1Click: onBuyClick
				}}
			>
				<uistroke Thickness={5} />
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(62, 216, 40)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(171, 248, 71))
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
					Position={new UDim2(0.182, 0, 0.123, 0)}
					Size={new UDim2(0.636, 0, 0.754, 0)}
					Text={price}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke Thickness={4} />
				</textlabel>
			</imagebutton>
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
				Position={new UDim2(0.034, 0, 0.757, 0)}
				Size={new UDim2(0.93, 0, 0.058, 0)}
				Text={description}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				ZIndex={4}
			>
				<uistroke Thickness={3} />
			</textlabel>
			<imagelabel
				key="Backgroundimage"
				BackgroundTransparency={1}
				ClipsDescendants={true}
				Image={backgroundImage}
				ImageColor3={backgroundImageColor}
				Position={new UDim2(-0.886, 0, -0.036000000000000004, 0)}
				Size={new UDim2(2.822, 0, 1.052, 0)}
				ZIndex={0}
			>
				<uigradient
					Rotation={-90}
					Transparency={
						new NumberSequence([
							new NumberSequenceKeypoint(0, 0, 0),
							new NumberSequenceKeypoint(1, 0.581, 0)
						])
					}
				/>
				<uiaspectratioconstraint AspectRatio={1.594} />
			</imagelabel>
			<imagelabel
				BackgroundTransparency={1}
				Image="rbxassetid://124206088171388"
				ImageTransparency={0.54}
				Position={new UDim2(-0.025, 0, 0.65, 0)}
				Size={new UDim2(0.758, 0, 0.522, 0)}
			>
				<uiaspectratioconstraint AspectRatio={0.862} />
			</imagelabel>
			<imagelabel
				BackgroundTransparency={1}
				Image="rbxassetid://94776997597220"
				Position={new UDim2(-0.185, 0, 0.735, 0)}
				Size={new UDim2(0.666, 0, 0.459, 0)}
			>
				<uiaspectratioconstraint AspectRatio={0.862} />
			</imagelabel>
		</imagebutton>
	)
}
