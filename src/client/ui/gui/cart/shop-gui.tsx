import React, { useState } from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { IShopItem } from "shared/type.helper"
import { ClientFunctions } from "shared/network.helper"
import { ShopCartList } from "./components/shop-cart-list"
import { ShopBottomHud } from "./components/shop-bottom-hud"
import PopGui from "client/ui/components/pop-gui"

export function ShopGui() {
	const [selectedItem, setSelectedItem] = useState<IShopItem | undefined>(
		undefined
	)

	// Fetch player inventory to check ownership
	const { data: inventory, refetch: refetchInventory } = useQuery({
		queryKey: ["player-inventory", "cart"],
		queryFn: async () => {
			const [inv, inventoryError] =
				await ClientFunctions.ShopService.getPlayerInventory.invoke("cart")
			if (inventoryError || !inv) {
				return { cart: [] }
			}
			return inv
		}
	})

	const isOwned = selectedItem
		? (inventory?.cart.includes(selectedItem.name) ?? false)
		: false

	const handleSelectItem = (item: IShopItem) => {
		setSelectedItem(item)
	}

	const handlePurchaseSuccess = () => {
		refetchInventory()
	}
	print(
		"Rendering ShopGui with selected item:",
		selectedItem,
		"Is owned?",
		isOwned
	)
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
