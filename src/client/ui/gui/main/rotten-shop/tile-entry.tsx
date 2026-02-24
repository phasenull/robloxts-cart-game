import React from "@rbxts/react"

interface TileEntryProps {
	title: string
	layoutOrder?: number
}

export function TileEntry({ title }: TileEntryProps) {
	return (
		<frame
			key="TitleEntry"
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			Position={new UDim2(0.044, 0, 0.73, 0)}
			Size={new UDim2(1, 0, 0.5, 0)}
		>
			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, Color3.fromRGB(0, 0, 0)),
						new ColorSequenceKeypoint(1, Color3.fromRGB(0, 0, 0))
					])
				}
				Transparency={
					new NumberSequence([
						new NumberSequenceKeypoint(0, 1, 0),
						new NumberSequenceKeypoint(0.501, 0.6, 0),
						new NumberSequenceKeypoint(1, 1, 0)
					])
				}
			/>
			<uiaspectratioconstraint AspectRatio={20} />
			<textlabel
				key="TitleText"
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				FontFace={
					new Font(
						"rbxasset://fonts/families/GothamSSm.json",
						Enum.FontWeight.Heavy,
						Enum.FontStyle.Normal
					)
				}
				Position={new UDim2(0.183, 0, 0.074, 0)}
				Size={new UDim2(0.636, 0, 0.833, 0)}
				Text={title}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
			>
				<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.01} />
			</textlabel>
		</frame>
	)
}