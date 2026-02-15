import { useQuery } from "@rbxts/react-query"
import { MarketplaceService } from "@rbxts/services"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"

interface UseProductPriceOptions {
	productId: number | undefined
	enabled?: boolean
}

interface ProductPriceData {
	priceInRobux: number | undefined
	isLoading: boolean
	error: unknown
}

/**
 * Hook to fetch product price from MarketplaceService
 * @param productId The developer product ID
 * @param enabled Whether to enable the query (default: true)
 * @returns Product price data
 */
export function useProductPrice({ productId, enabled = true }: UseProductPriceOptions): ProductPriceData {
	const { data, isLoading, err } = useQuery({
		queryKey: ["product-price", productId ?? "none"],
		queryFn: async () => {
			if (!productId) {
				return undefined
			}

			if (__IS_EDIT__ ) {
				// Mock data for Studio/UI labs
				return {
					PriceInRobux: 100 + (productId % 500)
				} as DeveloperProductInfo
			}

			const info = MarketplaceService.GetProductInfoAsync(
				productId,
				Enum.InfoType.Product
			) as DeveloperProductInfo

			return info
		},
		enabled: enabled && productId !== undefined,
		staleTime: 300_000 // Cache for 5 minutes
	})

	return {
		priceInRobux: data?.PriceInRobux,
		isLoading,
		error: err
	}
}
