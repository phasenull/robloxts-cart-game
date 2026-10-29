import { useEffect, useState } from "@rbxts/react"
import { useSettings } from "../contexts/settings.context"

export default function useAnimateValue(args: {
	target_value: number
	tween_info?: TweenInfo
	ignore_settings?: boolean
	initial_value?: number
	enabled?: boolean,
}) {
	const settings = useSettings()
	const [value, setValue] = useState(args.initial_value || 0)
	useEffect(() => {
		const number_value = new Instance("NumberValue")
		number_value.Value = args.initial_value ?? value
		const connection = number_value
			.GetPropertyChangedSignal("Value")
			.Connect(() => {
				setValue(number_value.Value)
			})
		const modified_tweeninfo = new TweenInfo(
			args.ignore_settings || settings.animation_speed_multiplier === 0
				? 0
				: (args.tween_info?.Time ?? 1) / settings.animation_speed_multiplier,
			args.tween_info?.EasingStyle ?? Enum.EasingStyle.Linear,
			args.tween_info?.EasingDirection ?? Enum.EasingDirection.Out,
			args.tween_info?.RepeatCount ?? 0,
			args.tween_info?.Reverses ?? false,
			args.tween_info?.DelayTime ?? 0
		)
		const tweenInfo = modified_tweeninfo
		const tween = game
			.GetService("TweenService")
			.Create(number_value, tweenInfo, {
				Value: args.target_value
			})
		if (args.enabled === false) return() => {
			tween.Cancel()
			connection.Disconnect()
			number_value?.Destroy()
		}
		tween.Play()
		tween.Completed.Once(() => {
			number_value.Value = args.target_value
			connection.Disconnect()
			number_value?.Destroy()
		})
		return () => {
			tween.Cancel()
			connection.Disconnect()
			number_value?.Destroy()
		}
	}, [args.target_value, args.enabled, args.initial_value])
	return value
}
