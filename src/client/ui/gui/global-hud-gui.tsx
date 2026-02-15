import React from "@rbxts/react";
import { UIDIM } from "../constants";

export function GlobalHUDGui() {
	return <frame Size={UIDIM.ONE}>

	</frame>
}

function CashLabel() {
	<frame
	Key="CashLabel"
	BackgroundColor3={Color3.fromRGB(0, 36, 62)}
	BorderSizePixel={0}
	Position={new UDim2(-1.458, 0, 0.293, 0)}
	Size={new UDim2(2.458, 0, 0.177, 0)}
>
	<textlabel
		Key="CashText"
		AnchorPoint={new Vector2(1, 0.5)}
		BackgroundTransparency={1}
		Font={Enum.Font.GothamBlack}
		FontFace={Font { Family = rbxasset://fonts/families/GothamSSm.json, Weight = Heavy, Style = Normal }}
		Position={new UDim2(0.961, 0, 0.517, 0)}
		Size={new UDim2(0.55, 0, 0.807, 0)}
		Text="$ 100.2K"
		TextColor3={Color3.fromRGB(255, 255, 255)}
		TextScaled={true}
		TextSize={14}
		TextWrapped={true}
		TextXAlignment={Enum.TextXAlignment.Right}
	>
		<uigradient
			Color={new ColorSequence([new ColorSequenceKeypoint(0, Color3.fromRGB(66, 214, 0)), new ColorSequenceKeypoint(1, Color3.fromRGB(255, 251, 0))])}
			Rotation={-90}
		/>
		<uistroke Color={Color3.fromRGB(45, 45, 45)} Thickness={3.2} />
	</textlabel>
	<uigradient
		Rotation={180}
		Transparency={new NumberSequence([new NumberSequenceKeypoint(0, 0.294, 0), new NumberSequenceKeypoint(1, 1, 0)])}
	/>
	<uistroke Thickness={4}>
		<uigradient
			Rotation={180}
			Transparency={new NumberSequence([new NumberSequenceKeypoint(0, 0.806, 0), new NumberSequenceKeypoint(1, 1, 0)])}
		/>
	</uistroke>
	<imagebutton
		Key="Plus"
		AnchorPoint={new Vector2(0.5, 0.5)}
		BackgroundColor3={Color3.fromRGB(255, 255, 255)}
		BorderSizePixel={0}
		Position={new UDim2(0.327, 0, 0.5, 0)}
		Size={new UDim2(0.12, 0, 0.55, 0)}
	>
		<uiaspectratioconstraint AspectRatio={0.985} />
		<textlabel
			BackgroundTransparency={1}
			Font={Enum.Font.GothamBlack}
			FontFace={Font { Family = rbxasset://fonts/families/GothamSSm.json, Weight = Heavy, Style = Normal }}
			Size={new UDim2(1, 0, 1, 0)}
			Text="+"
			TextColor3={Color3.fromRGB(255, 255, 255)}
			TextScaled={true}
			TextSize={14}
			TextWrapped={true}
		>
			<uistroke Thickness={2.5} />
		</textlabel>
		<imagelabel
			Key="Tile"
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundTransparency={1}
			Image="rbxassetid://120250412681646"
			ImageContent={Content}
			ImageTransparency={0.6}
			Position={new UDim2(0.527, 0, 0.47200000000000003, 0)}
			ScaleType={Enum.ScaleType.Tile}
			Size={new UDim2(1.053, 0, 0.9430000000000001, 0)}
			TileSize={new UDim2(0, 50, 0, 50)}
		/>
		<frame
			Key="Bottom"
			BackgroundColor3={Color3.fromRGB(0, 0, 0)}
			BackgroundTransparency={0.4}
			BorderSizePixel={0}
			Position={new UDim2(0, 0, 0.921, 0)}
			Size={new UDim2(1, 0, 0.079, 0)}
		/>
		<uistroke Thickness={3} />
		<uigradient
			Color={new ColorSequence([new ColorSequenceKeypoint(0, Color3.fromRGB(62, 216, 40)), new ColorSequenceKeypoint(1, Color3.fromRGB(171, 248, 71))])}
			Rotation={-90}
		/>
	</imagebutton>
	<imagelabel
		BackgroundTransparency={1}
		Image="rbxassetid://71695823398046"
		ImageColor3={Color3.fromRGB(0, 0, 0)}
		ImageContent={Content}
		ImageTransparency={0.8}
		Size={new UDim2(1, 0, 0.921, 0)}
		ZIndex={0}
	>
		<uigradient
			Rotation={180}
			Transparency={new NumberSequence([new NumberSequenceKeypoint(0, 0.294, 0), new NumberSequenceKeypoint(1, 1, 0)])}
		/>
	</imagelabel>
	<uiaspectratioconstraint
		AspectRatio={5.525}
		AspectType={Enum.AspectType.ScaleWithParentSize}
		DominantAxis={Enum.DominantAxis.Height}
	/>
</frame>
}