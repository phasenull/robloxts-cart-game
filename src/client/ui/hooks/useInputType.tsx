import { useEffect, useState } from "@rbxts/react"
import { UserInputService } from "@rbxts/services"

function getInputTypeFromUserInputType(userInputType: Enum.UserInputType): "Gamepad" | "Keyboard" | "Mobile" {
	
	if (userInputType === Enum.UserInputType.Gamepad1) {
		return "Gamepad"
	} else if (userInputType === Enum.UserInputType.Touch) {
		return "Mobile"
	} else {
		return "Keyboard"
	}
}
export function useInputType(): "Gamepad" | "Keyboard" | "Mobile" {
	const [inputType, setInputType] = useState<"Gamepad" | "Keyboard" | "Mobile">(getInputTypeFromUserInputType(UserInputService.GetLastInputType()))
	useEffect(() => {
		const connection = UserInputService.LastInputTypeChanged.Connect((lastInputType) => {
			setInputType(getInputTypeFromUserInputType(lastInputType))
		})
		return () => {
			connection.Disconnect()
		}
	}, [])
	return inputType
}