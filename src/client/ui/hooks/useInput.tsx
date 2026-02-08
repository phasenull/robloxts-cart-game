import { useEffect, useState } from "@rbxts/react"
import { UserInputService } from "@rbxts/services"

export function useInput(key: Enum.KeyCode,handler?:(value:boolean)=>void) {
	const [pressed, setPressed] = useState(false)
	useEffect(() => {
		const inputBeganConnection = UserInputService.InputBegan.Connect(
			(input, processed) => {
				if (processed) return
				if (input.KeyCode === key) {

					if (handler) {
						handler(true)
					}
					setPressed(true)
				}
			}
		)
		const inputEndedConnection = UserInputService.InputEnded.Connect(
			(input, processed) => {
				if (processed) return
				if (input.KeyCode === key) {
					if (handler) {
						handler(false)
					}
					setPressed(false)
				}
			}
		)
		return () => {
			inputBeganConnection.Disconnect()
			inputEndedConnection.Disconnect()
		}
	}, [key])
	return pressed
}
