import { Workspace } from "@rbxts/services"
import { useAppTasks } from "client/common/ui/contexts/app-tasks.context"
import { useCartModel } from "./useCartModel"
import { useEffect, useRef, useState } from "@rbxts/react"
import { useMouseDelta } from "client/common/ui/hooks/useMouseDelta"
import {
	AnimateGarageMovement,
	BrickifyModel,
	RigCartModel
} from "shared/cart.helper"
import { ICart } from "shared/type.helper"
import { SHOP_CAMERA_OFFSET } from "client/common/ui/constants"
const GaragePivot = Workspace.FindFirstChild("GaragePreview")?.FindFirstChild(
	"CartPreviewAttachment"
) as Attachment
const GARAGE_CART_NAME = "GaragePreviewCart"

export function useShopPreview(cart_name?: string) {
	const tasks = useAppTasks()
	const model = useCartModel(cart_name, false)
	const camera = Workspace.CurrentCamera
	const { delta, viewportSize } = useMouseDelta()
	const [is_first_render, setIsFirstRender] = useState(true)
	const [currentCartName, setCurrentCartName] = useState<string | undefined>(undefined)
	
	useEffect(() => {
		if (!(model && camera)) {
			return
		}
		if (is_first_render) {
			setIsFirstRender(false)
			// Check if entrance animation cart is already showing the cart we want
			const existingCart = camera.FindFirstChild(GARAGE_CART_NAME) as ICart | undefined
			if (existingCart && cart_name) {
				// The entrance animation cart is already showing, just keep it
				setCurrentCartName(cart_name)
				// Clean up the unused model from useCartModel
				model.Destroy()
				return
			}
		}
		
		// Skip animation if we're trying to show the cart that's already showing
		if (cart_name === currentCartName) {
			// Clean up the duplicate model
			model.Destroy()
			return
		}
		
		const animator_model = camera.FindFirstChild(GARAGE_CART_NAME) as ICart | undefined
		const root = model.FindFirstChild("Root") as BasePart
		if (root) {
			root.Anchored = true
		}
		
		// Destroy previous cart with brickify out animation
		if (animator_model) {
			animator_model.Root.FindFirstChildOfClass("Weld")?.Destroy()

			const states = BrickifyModel(
				animator_model,
				"out",
				0.5,
				Enum.EasingStyle.Quad
			)
			animator_model.Name = "__old_temp"
			states.filterUndefined().map((state) => {
				if (state.tween.PlaybackState === Enum.PlaybackState.Playing) {
					state.tween.Completed.Wait()
				}
			})
			tasks.delay(1, () => {
				animator_model.Destroy()
			})
		}
		
		// Setup new cart
		model.Name = GARAGE_CART_NAME
		model.Parent = camera
		model.ScaleTo(1.5)
		const [_, bbox] = model.GetBoundingBox()
		model?.PivotTo(GaragePivot.WorldCFrame.mul(new CFrame(0, bbox.Y / 2, 0)))
		
		// Play brickify in animation
		BrickifyModel(model, "in", 0.5, Enum.EasingStyle.Quad)
		setCurrentCartName(cart_name)
		
		return () => {
			// runs after the effect's cleanup (the component may be unmounting): the App owns it
			tasks.spawn(() => {
				const states = BrickifyModel(model, "out", 0.5, Enum.EasingStyle.Quad)
				states.filterUndefined().map((state) => {
					if (state.tween.PlaybackState === Enum.PlaybackState.Playing) {
						state.tween.Completed.Wait()
					}
				})
				task.wait(1)
				model.Destroy()
			})
		}
	}, [model])

	// Camera is now handled by useGarageCamera hook in ShopGui
	// This effect just handles the mouse-based camera movement during preview

	if (!(camera && GaragePivot)) {
		return
	}
	
	// Get the visible cart (either from entrance animation or from useCartModel)
	const visibleCart = camera.FindFirstChild(GARAGE_CART_NAME) as ICart | undefined
	if (!visibleCart) {
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
		.mul(new CFrame(SHOP_CAMERA_OFFSET))
		.mul(new CFrame(0, math.rad(180), 0)).Position
	camera.CFrame = new CFrame(
		camera_position,
		GaragePivot.WorldPosition.add(new Vector3(0, 2, 0))
	)
}
