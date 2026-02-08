import { useEffect, useState } from "@rbxts/react"
import { ContextActionService, UserInputService } from "@rbxts/services"

export function useInput(args: {
	key: Enum.KeyCode
	handler?: (value: boolean) => void
	enabled: boolean
}) {
	const [pressed, setPressed] = useState(false)
	const { key, handler, enabled } = args
	useEffect(() => {
		// const inputBeganConnection = UserInputService.InputBegan.Connect(
		// 	(input, processed) => {
		// 		if (input.KeyCode !== key) return
		// 		if (processed) return
		// 		setPressed(true)
		// 		if (handler) {
		// 			handler(true)
		// 		}
		// 	}
		// )
		if (!enabled) {
			ContextActionService.UnbindAction(`useInput_${key.Name}`)
			return
		}
		ContextActionService.BindAction(
			`useInput_${key.Name}`,
			(_, state, input) => {
				if (input.KeyCode !== key) return Enum.ContextActionResult.Pass
				const is_pressed = state === Enum.UserInputState.Begin
				setPressed(is_pressed)
				if (handler) {
					handler(is_pressed)
				}
				return Enum.ContextActionResult.Sink
			},
			false,
			key
		)
		// const inputEndedConnection = UserInputService.InputEnded.Connect(
		// 	(input, processed) => {
		// 		if (input.KeyCode !== key) return
		// 		if (processed) return
		// 		setPressed(false)
		// 		if (handler) {
		// 			handler(false)
		// 		}
		// 	}
		// )
		return () => {
			ContextActionService.UnbindAction(`useInput_${key.Name}`)
		}
	}, [key, handler, enabled])
	return pressed
}
