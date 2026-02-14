import { Workspace } from "@rbxts/services"
import { useCartModel } from "./useCartModel"
import { useEffect, useRef } from "@rbxts/react"
import { useMouseDelta } from "client/ui/hooks/useMouseDelta"
import { AnimateGarageMovement, BrickifyModel } from "shared/cart.helper"
import { ICart } from "shared/type.helper"

export function useShopPreview(cart_name?: string) {
	const model = useCartModel(cart_name, false)
	const camera = Workspace.CurrentCamera
	const pivot = Workspace.FindFirstChild("GaragePreview")?.FindFirstChild(
		"CartPreviewAttachment"
	) as Attachment | undefined
	const original_cframe = useRef<CFrame>()
	const { delta, viewportSize } = useMouseDelta()
	useEffect(() => {
		if (!(model && camera)) {
			return
		}
		// original_cframe.current = camera.CFrame
		model.Parent = camera
		const [bbox, _] = model.GetBoundingBox()
		model?.PivotTo(root_cframe.mul(new CFrame(0, bbox.Y / 2, 0)))
		model.ScaleTo(1.5)
		BrickifyModel(model, "in", 0.5, Enum.EasingStyle.Quad)
		return () => {
			// camera.CFrame = original_cframe.current ?? camera.CFrame
			task.spawn(() => {
				const states = BrickifyModel(model, "out", 0.5, Enum.EasingStyle.Quad)
				states.map((state) => {
					if (state.tween.PlaybackState === Enum.PlaybackState.Playing) {
						state.tween.Completed.Wait()
					}
				})
				model.Destroy()
			})
		}
	}, [model])
	useEffect(() => {
		if (!camera) return
		camera.CameraType = Enum.CameraType.Scriptable
		camera.FieldOfView = 50
		return () => {
			camera.FieldOfView = 70
			camera.CameraType = Enum.CameraType.Custom
		}
	}, [])

	if (!(model && camera && pivot)) {
		return
	}
	const root_cframe = pivot.WorldCFrame
	const max_y_degrees = 10
	const max_degrees = 15
	const degrees = (delta.X / viewportSize.X) * max_degrees
	const y_degrees = (delta.Y / viewportSize.Y) * max_y_degrees
	const camera_position = root_cframe
		.mul(
			CFrame.Angles(
				0,
				math.rad(degrees - max_degrees / 2),
				math.rad(y_degrees - max_y_degrees / 2)
			)
		)
		.mul(new CFrame(-10, 2, -15))
		.mul(new CFrame(0, math.rad(180), 0)).Position
	camera.CFrame = new CFrame(camera_position, pivot.WorldPosition)
	model.PivotTo(pivot.WorldCFrame)
}
