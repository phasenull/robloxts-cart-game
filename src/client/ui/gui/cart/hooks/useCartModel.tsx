import { useEffect, useState } from "@rbxts/react"
import { assets } from "shared/assets"

export function useCartModel(cart_name?:string) {
	const [model, setModel] = useState<Model | undefined>(undefined)
	useEffect(() => {
		if (!cart_name) {
			return
		}
		const cloned = assets.carts.FindFirstChild(cart_name)?.Clone() as Model | undefined
		if (cloned) {
			cloned.Parent = undefined
			setModel(cloned)
		}
		return () => {
			if (model) {
				model.Destroy()
			}
		}
	}, [cart_name])
	return model
}