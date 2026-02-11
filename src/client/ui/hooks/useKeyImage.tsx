import { useEffect, useState } from "@rbxts/react"
import { useInputType } from "./useInputType"
import {
	GAMEPAD_BUTTONS,
	IActionKeyMap,
	MOUSE_KEYBOARD_BUTTONS
} from "../constants"
import { UserInputService } from "@rbxts/services"
import { A } from "shared/assets"

export function useActionImage(
	action: keyof IActionKeyMap,
	override_device?: "Gamepad" | "Keyboard" | "Mobile"
) {
	const input_type = override_device ?? useInputType()
	const [img, setImg] = useState<string | undefined>(undefined)
	useEffect(() => {
		print("rendering cart buttons with device", input_type)
		if (input_type === "Gamepad") {
			const key_code = GAMEPAD_BUTTONS[action]
			const image = UserInputService.GetImageForKeyCode(key_code)
			if (!image) {
				setImg(undefined)
				return
			}
			setImg(image)
		} else if (input_type === "Keyboard") {
			const key_code =
				MOUSE_KEYBOARD_BUTTONS[action as keyof typeof MOUSE_KEYBOARD_BUTTONS]
			if (!key_code) {
				setImg(undefined)
				return
			}

			let image: string | undefined
			switch (key_code) {
				case Enum.KeyCode.H: {
					image = A.ui.keys.h
					break
				}
				case Enum.KeyCode.Space: {
					image = A.ui.keys.space
					break
				}
			}
			setImg(image)
		} else if (input_type === "Mobile") {
			setImg(undefined)
		}
	}, [input_type, action])
	return img
}
