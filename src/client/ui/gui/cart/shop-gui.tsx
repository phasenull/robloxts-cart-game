import React, { useEffect, useRef, useState } from "@rbxts/react";
import { useQuery } from "@rbxts/react-query";
import { ICart, IInventoryData, IShopItem } from "shared/type.helper";
import { ClientFunctions } from "shared/network.helper";
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper";
import { ShopCartList } from "./components/shop-cart-list";
import { ShopBottomHud } from "./components/shop-bottom-hud";
import PopGui from "client/ui/components/pop-gui";
import { useShopPreview } from "./hooks/useShopPreview";
import { useShopGarageAnimation } from "./hooks/useShopGarageAnimation";
import { useGarageCamera } from "./hooks/useGarageCamera";
import { MOCK_CART_SHOP, MOCK_HONK_INVENTORY, MOCK_HONK_SHOP, MOCK_INVENTORY } from "shared/mocks";
import { UIHelper } from "client/ui.helper";
import { ShopWorldviewGuis } from "./shop/shopWorldviewGuis";
import { ShopHonkGrid } from "./components/shop-honk-grid";
import { Workspace } from "@rbxts/services";

export function ShopGui() {
	const isFirstRenderRef = useRef(true);

	// Fetch equipped cart preference first (needed for entrance animation)
	const { data: equippedCart, refetch: refetchEquippedCart } = useQuery({
		queryKey: ["player-preference", "cart"],
		queryFn: async () => {
			if (__IS_EDIT__) {
				return ["Cart"];
			}
			const [prefs, err] =
				await ClientFunctions.CustomizationService.getPlayerPreference.invoke(
					"cart",
				);
			if (err || !prefs) {
				return [];
			}
			return prefs;
		},
	});

	// Setup garage camera and animation with equipped cart
	const equippedCartName = equippedCart?.[0] || "Cart";
	const [isEntranceAnimationComplete, setIsEntranceAnimationComplete] =
		useState(false);

	useGarageCamera();
	const { mutate: mutateGarageAnimation } =
		useShopGarageAnimation(equippedCartName);

	// Handle entrance and exit animations - only play entrance animation on first render
	useEffect(() => {
		UIHelper.toggleFade(false);

		// Wait for equipped cart data to load before playing animation
		if (!equippedCart) {
			return;
		}

		// Only play entrance animation on first render
		if (isFirstRenderRef.current) {
			mutateGarageAnimation("in");

			// Wait for entrance animation to complete (animation duration ~1.5s)
			const animationTimer = task.delay(1.5, () => {
				setIsEntranceAnimationComplete(true);
			});

			isFirstRenderRef.current = false;

			return () => {
				if (animationTimer) {
					task.cancel(animationTimer);
				}
			};
		} else {
			// On subsequent renders (after purchase), skip entrance animation
			setIsEntranceAnimationComplete(true);
		}
	}, [equippedCartName, equippedCart]);

	// Handle exit animation on unmount
	useEffect(() => {
		return () => {
			mutateGarageAnimation("out");
			setIsEntranceAnimationComplete(false);
		};
	}, []);

	// Fetch player inventory to check ownership
	const { data: inventory, refetch: refetchInventory } = useQuery({
		queryKey: ["player-inventory", "cart"],
		queryFn: async () => {
			if (__IS_EDIT__) {
				return { carts: MOCK_INVENTORY };
			}
			const [inv, inventoryError] =
				await ClientFunctions.ShopService.getPlayerInventory.invoke("cart");
			if (inventoryError || !inv) {
				return { carts: [] };
			}
			return inv;
		},
	});

	// Fetch equipped honk preference
	const { data: equippedHonkData, refetch: refetchEquippedHonk } = useQuery({
		queryKey: ["player-preference", "honk"],
		queryFn: async () => {
			if (__IS_EDIT__) return ["Pizza Scream"];
			const [prefs, err] =
				await ClientFunctions.CustomizationService.getPlayerPreference.invoke("honk");
			if (err || !prefs) return [];
			return prefs;
		},
	});

	// Fetch owned honks
	const { data: honkInventory, refetch: refetchHonkInventory } = useQuery({
		queryKey: ["player-inventory", "honk"],
		queryFn: async () => {
			if (__IS_EDIT__) return MOCK_HONK_INVENTORY;
			const [inv, err] =
				await ClientFunctions.ShopService.getPlayerInventory.invoke("honk");
			if (err || !inv) return [];
			return (inv["honk"] as string[] | undefined) ?? [];
		},
	});

	// Fetch honk shop items
	const { data: honkShopItems, refetch: refetchHonkShopItems } = useQuery({
		queryKey: ["shop-items", "honk"],
		queryFn: async () => {
			return MOCK_HONK_SHOP;
		},
	});

	const [selectedItem, setSelectedItem] = useState<IShopItem | undefined>({
		name: "Cart",
		price: 0,
	});
	const hasSetInitialSelection = useRef(false);

	// Set initial selection to equipped cart when data loads (only once)
	useEffect(() => {
		if (
			equippedCart &&
			equippedCart.size() > 0 &&
			isEntranceAnimationComplete &&
			!hasSetInitialSelection.current
		) {
			setSelectedItem({
				name: equippedCart[0],
				price: 0, // This will be overridden by actual item data
			});
			hasSetInitialSelection.current = true;
		}
	}, [equippedCart, isEntranceAnimationComplete]);

	const isOwned = selectedItem
		? (inventory?.carts?.some((cart) => cart.name === selectedItem.name) ??
			false)
		: false;

	const isEquipped = selectedItem
		? (equippedCart?.includes(selectedItem.name) ?? false)
		: false;

	const handleSelectItem = (item: IShopItem) => {
		setSelectedItem(item);
	};

	const refetchShopCartListRef = useRef<(() => void) | undefined>();

	const handlePurchaseSuccess = () => {
		refetchInventory();
		refetchEquippedCart();
		if (refetchShopCartListRef.current) {
			refetchShopCartListRef.current();
		}
	};

	const handleHonkSuccess = () => {
		refetchHonkInventory();
		refetchEquippedHonk();
		refetchHonkShopItems();
	};

	// Only show preview after entrance animation completes
	useShopPreview(isEntranceAnimationComplete ? selectedItem?.name : undefined);

	return (
		<>
			{selectedItem ? <ShopWorldviewGuis
				cart={
					Workspace.CurrentCamera?.FindFirstChild("GaragePreviewCart") as ICart
				}
				equippedHonk={equippedHonkData?.[0]}
			/> : undefined}
			<ShopHonkGrid
				equippedHonk={equippedHonkData?.[0]}
				ownedHonks={honkInventory ?? []}
				honkItems={honkShopItems ?? []}
				onEquipSuccess={handleHonkSuccess}
			/>
			<ShopCartList
				selectedItem={selectedItem}
				onSelectItem={handleSelectItem}
				equippedCart={equippedCart?.[0]}
				onRefetchReady={(refetch) => {
					refetchShopCartListRef.current = refetch;
				}}
			/>
			<ShopBottomHud
				selectedItem={selectedItem}
				isOwned={isOwned}
				isEquipped={isEquipped}
				onPurchaseSuccess={handlePurchaseSuccess}
			/>
		</>
	);
}
