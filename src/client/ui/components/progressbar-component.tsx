import React from "@rbxts/react";
import { UIDIM } from "../constants";

export function ProgressBarComponent(props: {
	progress: number;
	total_duration?: number;
	Color?: Color3;
	Size?: UDim2;
	Position?: UDim2;
	Text?: string;
	AnchorPoint?: Vector2;
	children?: React.ReactNode;
}) {
	const target_color = props.Color ?? Color3.fromRGB(249, 65, 0);
	const tinted_color = target_color.Lerp(Color3.fromRGB(255, 255, 255), 0.8);
	return (
		<frame
			key="Countdown"
			AnchorPoint={props.AnchorPoint ?? new Vector2(0.5, 0)}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			Position={props.Position ?? new UDim2(0.5, 0, 0.112, 0)}
			Size={props.Size ?? new UDim2(0.516, 0, 0.029, 0)}
		>
			<frame key="Main" BackgroundTransparency={1} Size={new UDim2(1, 0, 1, 0)}>
				<frame
					key="Bar"
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={0.15}
					BorderSizePixel={0}
					Size={new UDim2(props.progress, 0, 1, 0)}
				>
					<uigradient
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, tinted_color),
								new ColorSequenceKeypoint(1, target_color),
							])
						}
						Rotation={90}
					/>
				</frame>
			</frame>
			<uigradient
				Rotation={90}
				Transparency={
					new NumberSequence([
						new NumberSequenceKeypoint(0, 0.6, 0),
						new NumberSequenceKeypoint(1, 0.256, 0),
					])
				}
			/>
			<textlabel
				key="Seconds"
				AnchorPoint={new Vector2(1, 0.5)}
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				FontFace={
					new Font(
						"rbxasset://fonts/families/GothamSSm.json",
						Enum.FontWeight.Regular,
						Enum.FontStyle.Normal,
					)
				}
				Position={new UDim2(0.932, 0, 0.5, 0)}
				Size={new UDim2(0.863, 0, 0.782, 0)}
				Text={props.Text ?? ""}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				ZIndex={2}
			>
				<uistroke Thickness={3} />
			</textlabel>
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0, 0)}
				BackgroundTransparency={1}
				Image="rbxassetid://120250412681646"
				ImageTransparency={0.9}
				Position={new UDim2(0, 0, 0, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 0.921, 0)}
				TileSize={new UDim2(0, 50, 0, 50)}
			/>
			<uiaspectratioconstraint
				AspectRatio={
					props.Size ? props.Size.X.Scale / props.Size.Y.Scale : 24.197
				}
				AspectType={Enum.AspectType.ScaleWithParentSize}
				DominantAxis={Enum.DominantAxis.Height}
			/>
			<imagelabel
				key="Shadow"
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.8}
				Position={new UDim2(0, 0, 0, 0)}
				Size={new UDim2(1, 0, 0.994, 0)}
				ZIndex={0}
			/>
			{props.children}
			<uistroke Color={Color3.fromRGB(41, 41, 41)} Thickness={4} />
		</frame>
	);
}
