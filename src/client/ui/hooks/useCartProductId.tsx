import { useMemo } from "@rbxts/react"
import { getConfig } from "shared/config.helper"

/**
 * Hook to find the product_id for a cart based on its name
 * @param cartName The name of the cart to find
 * @returns The product_id or undefined if not found
 */
export function useCartProductId(cartName: string): number | undefined {
	return useMemo(() => {
		const config = getConfig()
		const cartConfig = config.CartConfig

		// Find the cart entry with matching name
		const cartEntry = cartConfig.find((cart) => cart.name === cartName)

		return cartEntry?.product_id
	}, [cartName])
}
