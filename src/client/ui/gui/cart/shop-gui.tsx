import React, { useState } from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { IShopItem } from "shared/type.helper"
import { ClientFunctions } from "shared/network.helper"
import { __IS_EDIT__ } from "shared/config.helper"
import { ShopCartList } from "./components/shop-cart-list"
import { ShopBottomHud } from "./components/shop-bottom-hud"
import PopGui from "client/ui/components/pop-gui"
import { useShopPreview } from "./hooks/useShopPreview"

export function ShopGui() {
	
	// Fetch player inventory to check ownership
	const { data: inventory, refetch: refetchInventory } = useQuery({
		queryKey: ["player-inventory", "cart"],
		queryFn: async () => {
			if (__IS_EDIT__) {
				return { cart: ["Cart", "Fast Cart"] }
			}
			const [inv, inventoryError] =
				await ClientFunctions.ShopService.getPlayerInventory.invoke("cart")
			if (inventoryError || !inv) {
				return { cart: [] }
			}
			return inv
		},
		enabled: !__IS_EDIT__
	})
	const [selectedItem, setSelectedItem] = useState<IShopItem | undefined>({"name": "Cart", price: 0})

	const isOwned = selectedItem
		? (inventory?.cart.includes(selectedItem.name) ?? false)
		: false

	const handleSelectItem = (item: IShopItem) => {
		setSelectedItem(item)
	}

	const handlePurchaseSuccess = () => {
		refetchInventory()
	}
	useShopPreview(selectedItem?.name)
	return (
		<>
			<ShopCartList
				selectedItem={selectedItem}
				onSelectItem={handleSelectItem}
			/>
			<ShopBottomHud
				selectedItem={selectedItem}
				isOwned={isOwned}
				onPurchaseSuccess={handlePurchaseSuccess}
			/>
		</>
	)
}
