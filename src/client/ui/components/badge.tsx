import { text } from "@rbxts/better-gizmos"
import { GoofyText } from "./goofy-text"
import React from "@rbxts/react"
import { UIDIM } from "../constants"
import StringUtils from "@rbxts/string-utils"

export function Badge(props: {
	text?: string
	icon?: string
	size?: UDim2
	color?: Color3
	ratio?: number
	MaxTextSize?: number
	MinTextSize?: number
}) {
	const size = props.size ?? new UDim2(1, 0, 1, 0)
	const text_length = props.text?.size() || 1
	let ratio = text_length / 2.5 + 1 / 2
	if (StringUtils.endsWith(props.text || "", "+")) {
		ratio = 1
	}
	if (tonumber(props.text) !== undefined) {
		ratio = 1
	}
	if (props.ratio) {
		ratio = props.ratio
	}
	if (props.text) {
		return (
			<GoofyText
				IgnoreTextSizing
				Thickness={0.1}
				BackgroundColor3={props.color ?? new Color3(1, 0, 0)}
				BackgroundTransparency={0}
				Size={props.size ?? new UDim2(0.3 * ratio, 0, 0.3, 0)}
				AnchorPoint={new Vector2(0.7, 0.5)}
				Position={new UDim2(1, 0, 0, 0)}
				ZIndex={3}
				Text={`${props.text}`}
				Ratio={ratio}
				MinTextSize={props.MinTextSize ?? 1}
			>
				<uicorner CornerRadius={new UDim(0.5, 0)} />
			</GoofyText>
		)
	}
}
