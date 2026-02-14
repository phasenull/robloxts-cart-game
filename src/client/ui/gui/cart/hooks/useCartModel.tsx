import { useEffect, useState } from "@rbxts/react"
import { assets } from "shared/assets"
import { ICart } from "shared/type.helper"

export function useCartModel(cart_name?:string,auto_destroy = true) {
	const [model, setModel] = useState<ICart | undefined>(undefined)
	useEffect(() => {
		if (!cart_name) {
			return
		}
		const cloned = assets.carts.FindFirstChild(cart_name)?.Clone() as ICart | undefined
		if (cloned) {
			cloned.Parent = undefined
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