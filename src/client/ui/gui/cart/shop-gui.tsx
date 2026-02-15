import React, { useEffect, useState } from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { ICart, IInventoryData, IShopItem } from "shared/type.helper"
import { ClientFunctions } from "shared/network.helper"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { ShopCartList } from "./components/shop-cart-list"
import { ShopBottomHud } from "./components/shop-bottom-hud"
import PopGui from "client/ui/components/pop-gui"
import { useShopPreview } from "./hooks/useShopPreview"
import { useShopGarageAnimation } from "./hooks/useShopGarageAnimation"
import { useGarageCamera } from "./hooks/useGarageCamera"
import { MOCK_CART_SHOP, MOCK_INVENTORY } from "shared/mocks"
import { useCart } from "client/ui/contexts/cart.context"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { UIHelper } from "client/ui.helper"

export function ShopGui() {
	const cart = useCart().cart
	const nav = useNavigator()

	// Fetch equipped cart preference first (needed for entrance animation)
	const { data: equippedCart, refetch: refetchEquippedCart } = useQuery({
		queryKey: ["player-preference", "cart"],
		queryFn: async () => {
			if (__IS_EDIT__) {
				return ["Cart"]
			}
			const [prefs, err] =
				await ClientFunctions.CustomizationService.getPlayerPreference.invoke(
					"cart"
				)
			if (err || !prefs) {
				return []
			}
			return prefs
		}
	})

	// Setup garage camera and animation with equipped cart
	const equippedCartName = equippedCart?.[0] || "Cart"
	const [isEntranceAnimationComplete, setIsEntranceAnimationComplete] =
		useState(false)
	
	useGarageCamera()
	const { mutate: mutateGarageAnimation } = useShopGarageAnimation(equippedCartName)

	// Handle entrance and exit animations
	useEffect(() => {
		UIHelper.toggleFade(false)

		// Play entrance animation with equipped cart
		mutateGarageAnimation("in")

		// Wait for entrance animation to complete (animation duration ~1.5s)
		const animationTimer = task.delay(1.5, () => {
			setIsEntranceAnimationComplete(true)
		})

		return () => {
			mutateGarageAnimation("out")
			setIsEntranceAnimationComplete(false)
			if (animationTimer) {
				task.cancel(animationTimer)
			}
		}
	}, [equippedCartName])

	// Fetch player inventory to check ownership
	const { data: inventory, refetch: refetchInventory } = useQuery({
		queryKey: ["player-inventory", "cart"],
		queryFn: async () => {
			if (__IS_EDIT__) {
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

	// Set initial selection to equipped cart when data loads
	useEffect(() => {
		if (
			equippedCart &&
			equippedCart.size() > 0 &&
			isEntranceAnimationComplete
		) {
			setSelectedItem({
				name: equippedCart[0],
				price: 0 // This will be overridden by actual item data
			})
		}
	}, [equippedCart, isEntranceAnimationComplete])

	const isOwned = selectedItem
		? (inventory?.carts?.some((cart) => cart.name === selectedItem.name) ??
			false)
		: false

	const isEquipped = selectedItem
		? (equippedCart?.includes(selectedItem.name) ?? false)
		: false

	const handleSelectItem = (item: IShopItem) => {
		setSelectedItem(item)
	}

	const handlePurchaseSuccess = () => {
		refetchInventory()
		refetchEquippedCart()
	}
	
	// Only show preview after entrance animation completes
	useShopPreview(isEntranceAnimationComplete ? selectedItem?.name : undefined)
	
	// Close shop if player is in a cart
	if (cart) {
		nav.closeAll()
		return
	}
	return (
		<>
			<ShopCartList
				selectedItem={selectedItem}
				onSelectItem={handleSelectItem}
				equippedCart={equippedCart?.[0]}
			/>
			<ShopBottomHud
				selectedItem={selectedItem}
				isOwned={isOwned}
				isEquipped={isEquipped}
				onPurchaseSuccess={handlePurchaseSuccess}
			/>
		</>
	)
}
