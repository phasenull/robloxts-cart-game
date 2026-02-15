import React, { useEffect, useState } from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { ICart, IInventoryData, IShopItem } from "shared/type.helper"
import { ClientFunctions } from "shared/network.helper"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { ShopCartList } from "./components/shop-cart-list"
import { ShopBottomHud } from "./components/shop-bottom-hud"
import PopGui from "client/ui/components/pop-gui"
import { useShopPreview } from "./hooks/useShopPreview"
import { AnimateGarageMovement, RigCartModel } from "shared/cart.helper"
import { ReplicatedStorage, Workspace } from "@rbxts/services"
import { assets } from "shared/assets"
import { useShopGarageAnimation } from "./hooks/useShopGarageAnimation"
import { MOCK_CART_SHOP, MOCK_INVENTORY } from "shared/mocks"
import { useCart } from "client/ui/contexts/cart.context"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { UIHelper } from "client/ui.helper"

export function ShopGui() {
	// Fetch player inventory to check ownership
	const { mutate: mutateGarageAnimation } = useShopGarageAnimation()
	useEffect(() => {
		UIHelper.toggleFade(false)
		mutateGarageAnimation("in")
		return () => {
			mutateGarageAnimation("out")
		}
	}, [])
	const cart = useCart().cart
	const { data: inventory, refetch: refetchInventory } = useQuery({
		queryKey: ["player-inventory", "cart"],
		queryFn: async () => {
			if (__IS_EDIT__ || __IS_STUDIO__) {
				return { carts: MOCK_INVENTORY }
			}
			const [inv, inventoryError] =
				await ClientFunctions.ShopService.getPlayerInventory.invoke("cart")
			if (inventoryError || !inv) {
				return { carts: [] }
			}
			return inv
		}
	})
	const [selectedItem, setSelectedItem] = useState<IShopItem | undefined>({
		name: "Cart",
		price: 0
	})

	const isOwned = selectedItem
		? (inventory?.carts?.some((cart) => cart.name === selectedItem.name) ?? false)
		: false

	const handleSelectItem = (item: IShopItem) => {
		setSelectedItem(item)
	}

	const handlePurchaseSuccess = () => {
		refetchInventory()
	}
	useShopPreview(selectedItem?.name)
	const nav = useNavigator()
	if (cart) {
		nav.closeAll()
		return
	}
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
