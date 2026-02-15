import { useMutation, useQuery } from "@rbxts/react-query"
import { Workspace } from "@rbxts/services"
import { assets } from "shared/assets"
import {
	AnimateGarageMovement,
	CartAnimator,
	RigCartModel
} from "shared/cart.helper"
import { __IS_EDIT__ } from "shared/config.helper"
import { ClientFunctions } from "shared/network.helper"
import { ICart } from "shared/type.helper"

export function useShopGarageAnimation() {
	const { data: equipped_cart } = useQuery({
		queryKey: ["shop-garage-animation-data"],
		queryFn: async () => {
			if (__IS_EDIT__) return ["Cart"]
			const [data, err] =
				await ClientFunctions.CustomizationService.getPlayerPreference.invokeWithTimeout(
					5000,
					"cart"
				)
			if (err || !data) {
				throw err || "Failed to get cart preference"
			}
			return data
		}
	})
	return useMutation({
		mutationFn: async (direction: "in" | "out") => {
			const model =
				direction === "in"
					? (assets.carts.FindFirstChild(equipped_cart?.[0] || "Cart")?.Clone() as
							| ICart
							| undefined)
					: (Workspace.CurrentCamera?.FindFirstChild("GaragePreviewCart") as
							| ICart
							| undefined)
			if (direction === "out") {
				model?.Destroy()
				return true
			}
			if (!model) {
				throw `Model for equipped cart not found: ${equipped_cart?.[0]}`
			}
			model.GetTags().forEach((tag) => model.RemoveTag(tag))
			model.Name = `GaragePreviewCart`
			model.Parent = Workspace.CurrentCamera
			RigCartModel(model)
			model.ScaleTo(1.5)
			const [_, bbox] = model.GetBoundingBox()
			model.PivotTo(
				CartAnimator!.MovePart.CFrame.mul(new CFrame(0, bbox.Y / 2, 0))
			)
			AnimateGarageMovement(model, direction)
			return model
		},
		queryKey: ["shop-garage-animation", `${equipped_cart?.join(",")}`]
	})
}
