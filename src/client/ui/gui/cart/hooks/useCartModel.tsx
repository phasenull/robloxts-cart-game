import { useEffect, useState } from "@rbxts/react"
import { Workspace } from "@rbxts/services"
import { assets } from "shared/common/assets"
import { RigCartModel } from "shared/cart.helper"
import { __IS_EDIT__ } from "shared/common/config.builder"
import { ICart } from "shared/type.helper"

export function useCartModel(cart_name?: string, auto_destroy = true) {
	const [model, setModel] = useState<ICart | undefined>(undefined)
	useEffect(() => {
		if (!cart_name) {
			return
		}
		const cloned = assets.carts.FindFirstChild(cart_name)?.Clone() as
		| ICart
		| undefined
		if (cloned) {
			cloned.GetTags().map((tag) => cloned.RemoveTag(tag))
			// untagged and outside the world: no CartClientComponent is ever built for a preview
			cloned.RemoveTag("CartComponent")
			RigCartModel(cloned, "preview")
			setModel(cloned)
		}
		return () => {
			if (model && auto_destroy) {
				model.Destroy()
			}
		}
	}, [cart_name, auto_destroy])
	return model
}
