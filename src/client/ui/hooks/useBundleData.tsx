import { useMemo } from "@rbxts/react"
import { getConfig } from "shared/config.helper"
import { IPurchasable } from "shared/type.helper"

export function useBundleData(productId: number): IPurchasable | undefined {
	return useMemo(() => {
		const config = getConfig()
		return config.PurchasableConfig.find((p) => p.product_id === productId)
	}, [productId])
}
