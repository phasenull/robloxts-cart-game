import { Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import { useEffect, useState } from "@rbxts/react"
import { Workspace } from "@rbxts/services"
import { CartClientComponent } from "client/components/cart.client.component"
import { assets } from "@common/shared/assets"
import { CartAnimator, RigCartModel } from "shared/cart.helper"
import { __IS_EDIT__ } from "@common/shared/config.builder"
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
			cloned.RemoveTag("CartComponent")
			if (!__IS_EDIT__) {
				const components = Dependency<Components>()
				components.removeComponent(cloned, CartClientComponent)
			}
			RigCartModel(cloned)
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
