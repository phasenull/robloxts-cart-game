import { Workspace } from "@rbxts/services";
import { useCartModel } from "./useCartModel";
import { useEffect, useRef } from "@rbxts/react";
import { useMouseDelta } from "client/ui/hooks/useMouseDelta";

export function useShopPreview(cart_name?:string) {
	const model = useCartModel(cart_name)
	const camera = Workspace.CurrentCamera
	const pivot = Workspace.FindFirstChild("CartPreviewAttachment") as Attachment | undefined
	const original_cframe = useRef<CFrame>()
	const { delta, viewportSize } = useMouseDelta()
	useEffect(() => {
		if (!(model && camera && pivot)) {
			return
		}
		original_cframe.current = camera.CFrame
		model.Parent = camera
		camera.CameraType = Enum.CameraType.Scriptable
		const root_cframe = pivot.WorldCFrame
		const camera_position = root_cframe.mul(new CFrame(-10, -2, -15)).mul(new CFrame(0, math.rad(180), 0)).Position
		camera.CFrame = new CFrame(camera_position, pivot.WorldPosition)
		model.PivotTo(pivot.WorldCFrame)
		camera.FieldOfView = 50
		model.ScaleTo(1.5)
		return () => {
			camera.CFrame = original_cframe.current ?? camera.CFrame
			model?.Destroy()
			camera.FieldOfView = 70
			camera.CameraType = Enum.CameraType.Custom
		}
	}, [model])
}