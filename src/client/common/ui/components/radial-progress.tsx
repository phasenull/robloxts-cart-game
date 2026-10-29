import React, { useEffect, useState } from "@rbxts/react"
import useAnimateValue from "../hooks/useAnimateValue"
import { A } from "shared/common/assets"
import { UIDIM } from "../constants"

export function RadialProgress(props: {
	progress: number
	degrees_per_second?: number
	Size?: UDim2
	Position?: UDim2
	initial_progress?: number
	AnchorPoint?: Vector2
	Color?: Color3
}) {
	const dps = props.degrees_per_second ?? 360
	const value = useAnimateValue({
		// initial_value: 0,//props.initial_progress ||0,
		target_value: props.progress,
		tween_info: new TweenInfo(
			(props.progress * 360) / dps,
			Enum.EasingStyle.Linear
		),
		enabled: true
	})
	const progress_degrees = value * 360
	const Circle = (props: { rotation: number; visible?: boolean; color?: Color3 }) => (
		<frame Size={UIDIM.ONE} AnchorPoint={UIDIM.A_CENTER} Rotation={props.rotation} BackgroundTransparency={1} Position={UIDIM.CENTER}>
			<uiaspectratioconstraint AspectRatio={1} />
			<imagelabel
				Image={A.ui.ellipse}
				BackgroundTransparency={1}
				AnchorPoint={UIDIM.A_RIGHT}
				Size={UDim2.fromScale(0.5, 1)}
				ScaleType={Enum.ScaleType.Fit}
				ImageTransparency={0}
				Visible={props.visible ?? true}
				Position={UIDIM.CENTER}
				ImageColor3={props.color ?? new Color3(1, 1, 1)}
			/>
		</frame>
	)
	return (
		<frame
			Size={props.Size}
			Position={props.Position}
			BackgroundColor3={new Color3(1, 1, 1)}
			AnchorPoint={props.AnchorPoint}
		>
			<uistroke
				Color={new Color3(1, 1, 1)}
				Thickness={0.05}
				StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				BorderOffset={new UDim(0.07, 0)}
			/>
			<uicorner CornerRadius={new UDim(1, 0)} />
			<Circle rotation={math.clamp(math.clamp(progress_degrees,0,180)-180,0,180)+180} color={props.Color} />
			<Circle rotation={math.clamp(progress_degrees,0,180)+180} />
			<Circle rotation={math.clamp(math.clamp(progress_degrees,0,360)-180,0,180)+180} visible = {progress_degrees > 180} color={props.Color} />
			<uiaspectratioconstraint AspectRatio={1} />
		</frame>
	)
}
