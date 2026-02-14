import { Workspace } from "@rbxts/services"
import { useCartModel } from "./useCartModel"
import { useEffect, useRef, useState } from "@rbxts/react"
import { useMouseDelta } from "client/ui/hooks/useMouseDelta"
import {
	AnimateGarageMovement,
	BrickifyModel,
	RigCartModel
} from "shared/cart.helper"
import { ICart } from "shared/type.helper"
const GaragePivot = Workspace.FindFirstChild("GaragePreview")?.FindFirstChild(
	"CartPreviewAttachment"
) as Attachment

export function useShopPreview(cart_name?: string) {
	const model = useCartModel(cart_name, false)
	const camera = Workspace.CurrentCamera
	const original_cframe = useRef<CFrame>()
	const { delta, viewportSize } = useMouseDelta()
	const [is_first_render, setIsFirstRender] = useState(true)
	useEffect(() => {
		if (!(model && camera)) {
			return
		}
		if (is_first_render) {
			setIsFirstRender(false)
			return
		}
		const animator_model = Workspace.CurrentCamera?.FindFirstChild(
			"GaragePreviewCart"
		) as ICart | undefined
		if (animator_model) {
			animator_model.Root.FindFirstChildOfClass("Weld")?.Destroy()
			BrickifyModel(animator_model, "out", 0.5, Enum.EasingStyle.Quad)
		}
		// original_cframe.current = camera.CFrame
		model.Parent = camera
		RigCartModel(model)
		model.ScaleTo(1.5)
		const [_, bbox] = model.GetBoundingBox()
		model?.PivotTo(GaragePivot.WorldCFrame.mul(new CFrame(0, bbox.Y / 2, 0)))
		const root = model.FindFirstChild("Root") as BasePart
		if (root) {
			root.Anchored = true
		}
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

	if (!(model && camera && GaragePivot)) {
		return
	}
	const root_cframe = GaragePivot.WorldCFrame
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
	camera.CFrame = new CFrame(camera_position, GaragePivot.WorldPosition)
}
