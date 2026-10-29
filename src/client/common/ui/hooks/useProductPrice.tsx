import { useQuery } from "@rbxts/react-query"
import { MarketplaceService } from "@rbxts/services"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/common/config.builder"

interface UseProductPriceOptions {
	productId: number | undefined
	enabled?: boolean
}

interface ProductPriceData {
	priceInRobux: number | undefined
	isPending: boolean
	err: unknown
}

/**
 * Hook to fetch product price from MarketplaceService
 * @param productId The developer product ID
 * @param enabled Whether to enable the query (default: true)
 * @returns Product price data
 */
export function useProductPrice({ productId, enabled = true }: UseProductPriceOptions): ProductPriceData {
	const { data, isPending, err } = useQuery({
		queryKey: ["product-price", productId ?? "none"],
		queryFn: async () => {
			if (!productId) {
				return undefined
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
		isPending,
		err: err
	}
}
