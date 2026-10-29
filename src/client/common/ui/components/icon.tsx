import React, { forwardRef } from "@rbxts/react"
import { UIDIM } from "../constants"
interface IconProps {
	AnchorPoint?: Vector2
	Size?: UDim2
	Position?: UDim2
	Image: string
	children?: React.ReactNode
	escape_ratio?: boolean
	Transparency?: number
	Rotation?: number
	ZIndex?: number
	Color3?: Color3
	ScaleType?: Enum.ScaleType
}
export const Icon = forwardRef<ImageLabel, IconProps>((props,ref) => {
	return (
		<imagelabel
			ref={ref}
			ImageColor3={props.Color3}
			Interactable={false}
			ZIndex={props.ZIndex ?? 1}
			Rotation={props.Rotation ?? 0}
			ImageTransparency={props.Transparency ?? 0}
			ClipsDescendants={false}
			AnchorPoint={props.AnchorPoint}
			Position={props.Position}
			Size={props.Size ?? new UDim2(0.1, 0, 0.1, 0)}
			Image={props.Image}
			ScaleType={props.ScaleType}
			BackgroundTransparency={1}
		>
			{!props.escape_ratio && <uiaspectratioconstraint AspectRatio={1} />}
			{props.children}
		</imagelabel>
	)
})
