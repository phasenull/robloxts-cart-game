import React, { useEffect, useState } from "@rbxts/react"
import Signal from "@rbxts/signal"
import useAnimateValue from "client/ui/hooks/useAnimateValue"
export function FadeGui() {
	const [show, setShow] = useState(false)
	const transparency = useAnimateValue({
		target_value: show ? 1 : 0,
		tween_info: new TweenInfo(
			0.5,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out,
		)
	})
	useEffect(() => {
		const connection = FadeGuiEvent.Connect((show) => {
			setShow(show)
		})
		return () => {
			connection.Disconnect()
		}
	}, [])
	return (
		<frame
			Size={UDim2.fromScale(1, 1)}
			BackgroundTransparency={1-transparency}
			BackgroundColor3={new Color3(0, 0, 0)}
			BorderSizePixel={0}
			ZIndex={99}
		/>
	)
}
export const FadeGuiEvent = new Signal<(show: boolean) => void>()