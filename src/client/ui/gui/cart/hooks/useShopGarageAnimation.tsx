import { useMutation } from "@rbxts/react-query"
import { Workspace } from "@rbxts/services"
import { assets } from "shared/common/assets"
import { TypeTorch } from "@typetorch/framework"
import type { GarageController } from "client/controllers/garage.controller"
import {
	AnimateGarageMovement,
	getCartAnimator,
	loadGarageTracks,
	RigCartModel
} from "shared/cart.helper"
import { ICart } from "shared/type.helper"

/**
 * Hook for managing garage entrance/exit animations
 * @param cartName - The name of the cart to animate (should be the equipped cart)
 */
export function useShopGarageAnimation(cartName: string = "Cart") {
	return useMutation({
		mutationFn: async (direction: "in" | "out") => {
			const GARAGE_CART_NAME = "GaragePreviewCart"
			
			// For exit animation, find existing cart in camera
			if (direction === "out") {
				const existingModel = Workspace.CurrentCamera?.FindFirstChild(
					GARAGE_CART_NAME
				) as ICart | undefined
				existingModel?.Destroy()
				return true
			}

			// For entrance animation, create and setup new cart model
			const cartModel = assets.carts.FindFirstChild(cartName)?.Clone() as
				| ICart
				| undefined
				
			if (!cartModel) {
				throw `Cart model not found in assets: ${cartName}`
			}

			// Setup cart for garage display
			cartModel.GetTags().forEach((tag) => cartModel.RemoveTag(tag))
			cartModel.Parent = Workspace.CurrentCamera
			
			RigCartModel(cartModel, "preview")
			cartModel.Name = GARAGE_CART_NAME
			cartModel.ScaleTo(1.5)
			
			// Position cart at garage pivot
			const [_, bbox] = cartModel.GetBoundingBox()
			cartModel.PivotTo(
				getCartAnimator()!.MovePart.CFrame.mul(new CFrame(0, bbox.Y / 2, 0))
			)
			
			// Play entrance animation
			// the running GarageController's tracks; in UI Labs edit mode (no modules) a pair loaded for this call
			const tracks = TypeTorch.tryModule<GarageController>()?.tracks() ?? loadGarageTracks()
			AnimateGarageMovement(cartModel, direction, tracks)
			return cartModel
		},
	})
}
