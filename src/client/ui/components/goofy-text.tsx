import React, { InstanceProps } from "react";
export function GoofyText(
	props: React.InstanceProps<TextLabel> & {
		MaxTextSize?: number;
		MinTextSize?: number;
		Text: string;
		Ratio?: number;
		children?: any;
		Thickness?: number;
		Font?: Enum.Font;
		IgnoreTextSizing?: boolean;
		ZIndex?: number;
		Selectable?: boolean;
		Italic?: boolean;
		TextTransparency?: number;
		TextXAlignment?: Enum.TextXAlignment;
		TextYAlignment?: Enum.TextYAlignment;
		FontWeight?: Enum.FontWeight;
		RichText?: boolean;
	},
) {
	const TargetComponent = props.Selectable
		? (props: InstanceProps<TextBox>) => <textbox {...props} />
		: (props: InstanceProps<TextLabel>) => <textlabel {...props} />;
	return (
		<TargetComponent
			{...(props.Selectable
				? {
						TextEditable: false,
						ClearTextOnFocus: false,
					}
				: {})}
			RichText={props.RichText || false}
			TextTransparency={props.TextTransparency || 0}
			TextXAlignment={props.TextXAlignment || Enum.TextXAlignment.Center}
			TextYAlignment={props.TextYAlignment || Enum.TextYAlignment.Center}
			FontFace={
				new Font(
					`rbxasset://fonts/families/${props.Font?.Name || Enum.Font.FredokaOne.Name}.json`,
					props.FontWeight || Enum.FontWeight.Regular,
					props.Italic ? Enum.FontStyle.Italic : Enum.FontStyle.Normal,
				)
			}
			Rotation={props.Rotation}
			ZIndex={props.ZIndex || 1}
			Size={props.Size || new UDim2(0.3, 0, 0.3, 0)}
			TextColor3={props.TextColor3 || new Color3(1, 1, 1)}
			BackgroundColor3={props.BackgroundColor3 || new Color3(1, 1, 1)}
			AnchorPoint={props.AnchorPoint || new Vector2(0, 0)}
			Position={props.Position || new UDim2(0, 0, 0, 0)}
			BackgroundTransparency={props.BackgroundTransparency ?? 1}
			TextScaled={true}
			Text={props.Text}
		>
			<uistroke
				Color={props.TextStrokeColor3 || new Color3(0, 0, 0)}
				Thickness={props.Thickness ?? 0.15}
				StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				Transparency={props.TextTransparency ?? 0}
			/>
			{props.Ratio ? (
				<uiaspectratioconstraint AspectRatio={props.Ratio} />
			) : undefined}
			{!props.IgnoreTextSizing && (
				<uitextsizeconstraint
					MaxTextSize={props.MaxTextSize || 36}
					MinTextSize={props.MinTextSize || 10}
				/>
			)}
			{props.children}
		</TargetComponent>
	);
}
