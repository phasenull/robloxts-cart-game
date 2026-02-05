import { useContext, useEffect, useState } from "@rbxts/react"
import { GuiContext } from "../contexts/gui-manager.context"
import { Lighting, Workspace } from "@rbxts/services"
import useAnimateValue from "../hooks/useAnimateValue"

export default function BlurGui() {
	const camera = Workspace.CurrentCamera
	const default_fov = 70
	const open_gui = useContext(GuiContext).open_gui
	const blur = camera?.FindFirstChildOfClass("BlurEffect") as BlurEffect
	if (!blur) {
		const new_blur = new Instance("BlurEffect")
		new_blur.Name = "BlurEffect"
		new_blur.Size = 0
		new_blur.Parent = camera
	}
	const blur_amount = useAnimateValue({
		target_value: open_gui ? 1 : 0,
		tween_info: new TweenInfo(0.2)
	})
	blur.Size = blur_amount * 15
	useEffect(() => {
		return () => {
			const blur = camera?.FindFirstChildOfClass("BlurEffect") as BlurEffect
			if (blur) {
				blur.Size = 0
			}
		}
	},[])
	if (camera) {
		camera.FieldOfView = default_fov + blur_amount * 10
	}
	return undefined
}
