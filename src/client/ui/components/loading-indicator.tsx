import { A } from "shared/assets"
import useAnimateValue from "../hooks/useAnimateValue"
import React from "@rbxts/react"
export function LoadingIndicator(props: {
	Size?: UDim2
	AnchorPoint?: Vector2
	Position?: UDim2
}) {
	const value = useAnimateValue({
		target_value: 1,
		initial_value: 0,
		tween_info: new TweenInfo(
			1,
			Enum.EasingStyle.Linear,
			Enum.EasingDirection.Out,
			-1,
		)
	})
	return (
		<imagelabel
			Size={props.Size || new UDim2(0.2, 0, 0.2, 0)}
			AnchorPoint={props.AnchorPoint || new Vector2(0.5, 0.5)}
			Position={props.Position || new UDim2(0.5, 0, 0.5, 0)}
			Image={A.ui.loading_indicator_white}
			BackgroundTransparency={1}
			Rotation={value * 360}
		>
			<uiaspectratioconstraint AspectRatio={1} />
		</imagelabel>
	)
}
