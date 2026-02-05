import { A } from "shared/assets"
import { UIDIM } from "../constants"
import { useRadians } from "../hooks/useRendering"
import { Icon } from "./icon"
import React, { useEffect, useRef, useState } from "@rbxts/react"
import { TweenService } from "@rbxts/services"

export function Spark(props: { Position: UDim2 }) {
	const anim_duration = 2
	const seed = math.random()
	
	const thisRef = useRef<ImageLabel>()
	useEffect(() => {
		if (!thisRef.current) return
		const tween = TweenService.Create(
			thisRef.current,
			new TweenInfo(
				anim_duration+(seed-0.5),
				Enum.EasingStyle.Quint,
				Enum.EasingDirection.In,
				-1,
				true
			),
			{
				Rotation: 15*math.clamp((seed-0.5)*30,-1,1),
				ImageTransparency: 0
			}
		)
		tween.Play()
		return () => {
			tween.Cancel()
		}
	}, [])
	return (
		<Icon
			ref={thisRef}
			AnchorPoint={UIDIM.A_CENTER}
			Image={A.ui.sparkle}
			Transparency={1}
			Size={new UDim2(0.6, 0, 0.6, 0)}
			Position={props.Position}
			ZIndex={4}
		/>
	)
}
