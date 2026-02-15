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
	const [isEntranceAnimationComplete, setIsEntranceAnimationComplete] =
		useState(false)
	const { mutate: mutateGarageAnimation, isLoading: isAnimationLoading } =
		useShopGarageAnimation()
	useEffect(() => {
		UIHelper.toggleFade(false)

		// Set up camera for garage view
		const camera = Workspace.CurrentCamera
		const GaragePivot = Workspace.FindFirstChild(
			"GaragePreview"
		)?.FindFirstChild("CartPreviewAttachment") as Attachment | undefined

		if (camera && GaragePivot) {
			camera.CameraType = Enum.CameraType.Scriptable
			camera.FieldOfView = 50
			
			// Position camera to look at garage pivot (static position for entrance animation)
			const root_cframe = GaragePivot.WorldCFrame
			const camera_position = root_cframe
				.mul(new CFrame(-10, 5, -15))
				.Position
			camera.CFrame = new CFrame(
				camera_position,
				GaragePivot.WorldPosition.add(new Vector3(0, 2, 0))
			)
		}

		// Start the entrance animation
		mutateGarageAnimation("in")

		// Wait for entrance animation to complete
		task.delay(1.5, () => {
			setIsEntranceAnimationComplete(true)
		})

		return () => {
			mutateGarageAnimation("out")
			setIsEntranceAnimationComplete(false)
			if (camera) {
				camera.FieldOfView = 70
				camera.CameraType = Enum.CameraType.Custom
			}
		}
	}, [])
	const cart = useCart().cart
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

	// Fetch equipped cart preference
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
