import React, { useRef, useEffect } from "@rbxts/react"
import { UIHelper } from "client/ui.helper"

interface CurrencyEntryProps {
	title: string
	price: string
	icon?: string
	gradientColors?: [Color3, Color3, Color3]
	layoutOrder?: number
	onClick?: () => void
	onBuyClick?: () => void
}

export function CurrencyEntry({
	title,
	price,
	icon,
	gradientColors = [
		Color3.fromRGB(78, 115, 239),
		Color3.fromRGB(78, 169, 239),
		Color3.fromRGB(78, 115, 239)
	],
	layoutOrder = 1,
	onClick,
	onBuyClick
}: CurrencyEntryProps) {
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
			key="CurrencyEntry"
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			LayoutOrder={layoutOrder}
			Position={new UDim2(0.008, 0, 0.46, 0)}
			Size={new UDim2(0.32, 0, 0.425, 0)}
			Event={{
				MouseButton1Click: onClick
			}}
		>
			<uistroke Thickness={5} />
			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, gradientColors[0]),
						new ColorSequenceKeypoint(0.5, gradientColors[1]),
						new ColorSequenceKeypoint(1, gradientColors[2])
					])
				}
				Offset={new Vector2(-0.15, 0)}
				Rotation={90}
			/>
			<imagelabel
				key="Shadow"
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.84}
				Position={new UDim2(0, 0, 0.008, 0)}
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
				Size={new UDim2(1, 0, 0.135, 0)}
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
					Text={title}
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
				Position={new UDim2(0.551, 0, 0.753, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.419, 0, 0.218, 0)}
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
			{icon !== undefined && icon !== "" && (
				<imagelabel
					key="Icon"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image={icon}
					Position={new UDim2(0.5, 0, 0.4, 0)}
					ScaleType={Enum.ScaleType.Fit}
					Size={new UDim2(0.7000000000000001, 0, 0.7000000000000001, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
					ZIndex={6}
				>
					<uiaspectratioconstraint />
				</imagelabel>
			)}
		</imagebutton>
	)
}
