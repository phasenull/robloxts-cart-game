import { useEffect, useState } from "@rbxts/react"
import { UserInputService } from "@rbxts/services"

export function useInput(
	key: Enum.KeyCode,
	handler?: (value: boolean) => void,
) {
	const [pressed, setPressed] = useState(false)
	useEffect(() => {
		const inputBeganConnection = UserInputService.InputBegan.Connect(
			(input, processed) => {
				if (input.KeyCode !== key) return
				if (processed) return
				setPressed(true)
				if (handler) {
					handler(true)
				}
			}
		)
		const inputEndedConnection = UserInputService.InputEnded.Connect(
			(input, processed) => {
				if (input.KeyCode !== key) return
				if (processed) return
				setPressed(false)
				if (handler) {
					handler(false)
				}
			}
		)
		return () => {
			inputBeganConnection.Disconnect()
			inputEndedConnection.Disconnect()
		}
	}, [key, handler])
	return pressed
}
