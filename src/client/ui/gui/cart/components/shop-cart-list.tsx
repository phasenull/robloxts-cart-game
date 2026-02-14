import React, { useEffect } from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { ClientFunctions } from "shared/network.helper"
import { ShopCartEntry } from "./shop-cart-entry"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { LoadingIndicator } from "client/ui/components/loading-indicator"
import { IShopItem } from "shared/type.helper"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { MOCK_CART_INVENTORY } from "shared/mocks"

interface ShopCartListProps {
	selectedItem: IShopItem | undefined
	onSelectItem: (item: IShopItem) => void
}

export function ShopCartList({ selectedItem, onSelectItem }: ShopCartListProps) {
	// Fetch cart shop items
	const { data: cartItems, isLoading: isLoadingItems } = useQuery({
		queryKey: ["shop-items", "cart"],
		queryFn: async () => {
			if (__IS_EDIT__ || __IS_STUDIO__) {
				return MOCK_CART_INVENTORY as IShopItem[]
			}
			const [items, itemsError] = await ClientFunctions.ShopService.getShopItems.invoke("cart")
			if (itemsError || !items) {
				throw itemsError || "Failed to load cart items"
			}
			return items
		},
	})
	const navigator = useNavigator()
	useEffect(() => {
		navigator.setIsSidebarOpen(false)
		return () => {
			navigator.setIsSidebarOpen(true)
		}
	}, [])
	// Fetch player inventory
	const { data: inventory } = useQuery({
		queryKey: ["player-inventory", "cart"],
		queryFn: async () => {
			if (__IS_EDIT__ || __IS_STUDIO__) {
				return { cart: MOCK_CART_INVENTORY.map((item) => item.name) }
			}
			const [inv, inventoryError] = await ClientFunctions.ShopService.getPlayerInventory.invoke("cart")
			if (inventoryError || !inv) {
				return { cart: [] }
			}
			return inv
		},
		enabled: !__IS_EDIT__
	})

	const ownedCarts = inventory?.cart || []

	return (
		<frame
			key="List"
			AnchorPoint={new Vector2(0, 0.5)}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			Position={new UDim2(0.019, 0, 0.491, 0)}
			Size={new UDim2(0.8, 0, 0.8, 0)}
		>
			<uistroke Thickness={5} />
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://85705472974218"
				ImageTransparency={0.855}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 1, 0)}
				TileSize={new UDim2(0, 50, 0, 50)}
			/>
			<frame
				key="TopFrame"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0, 0, 0, 0)}
				Size={new UDim2(1, 0, 0.109, 0)}
			>
				<imagelabel
					key="Tile"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://120250412681646"
					ImageTransparency={0.7}
					Position={new UDim2(0.5, 0, 0.5, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 1, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<uistroke Thickness={5} />
				<frame
					key="Bottom"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.921, 0)}
					Size={new UDim2(1, 0, 0.079, 0)}
				/>
				<textlabel
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.111, 0, 0.106, 0)}
					Size={new UDim2(0.361, 0, 0.709, 0)}
					Text="Carts"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					ZIndex={5}
				>
					<uistroke Thickness={3} />
					<uiaspectratioconstraint
						AspectRatio={3.25}
						AspectType={Enum.AspectType.ScaleWithParentSize}
						DominantAxis={Enum.DominantAxis.Height}
					/>
				</textlabel>
				<imagelabel
					BackgroundTransparency={1}
					Image="rbxassetid://122451515865403"
					Position={new UDim2(0.011, 0, 0.078, 0)}
					Size={new UDim2(0.097, 0, 0.785, 0)}
				>
					<uiaspectratioconstraint
						AspectRatio={0.873}
						AspectType={Enum.AspectType.ScaleWithParentSize}
						DominantAxis={Enum.DominantAxis.Height}
					/>
				</imagelabel>
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(196, 81, 0)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(249, 177, 0))
						])
					}
					Rotation={-90}
				/>
			</frame>
			<scrollingframe
				Active={true}
				AnchorPoint={new Vector2(0.5, 0)}
				AutomaticCanvasSize={Enum.AutomaticSize.Y}
				BackgroundTransparency={1}
				CanvasSize={new UDim2(0, 0, 0, 0)}
				Position={new UDim2(0.5, 0, 0.109, 0)}
				ScrollBarImageColor3={Color3.fromRGB(0, 0, 0)}
				ScrollBarThickness={5}
				ScrollingDirection={Enum.ScrollingDirection.Y}
				Size={new UDim2(1, 0, 0.892, 0)}
			>
				<uigridlayout
					CellPadding={new UDim2(0.05, 0, 0.03, 0)}
					CellSize={new UDim2(0.47, 0, 0.47, 0)}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					SortOrder={Enum.SortOrder.LayoutOrder}
				>
					<uiaspectratioconstraint />
				</uigridlayout>
				<uipadding PaddingRight={new UDim(0.02, 0)} PaddingTop={new UDim(0.01, 0)} />
				{isLoadingItems ? (
					<LoadingIndicator />
				) : (
					cartItems?.map((item) => {
						const isOwned = ownedCarts.includes(item.name)
						const isSelected = selectedItem?.name === item.name
						return (
							<ShopCartEntry
								key={item.name}
								item={item}
								isSelected={isSelected}
								isOwned={isOwned}
								onClick={() => onSelectItem(item)}
							/>
						)
					})
				)}
			</scrollingframe>
			<uiaspectratioconstraint
				AspectRatio={0.6}
				AspectType={Enum.AspectType.ScaleWithParentSize}
				DominantAxis={Enum.DominantAxis.Height}
			/>
			<uigradient
				Rotation={90}
				Transparency={
					new NumberSequence([
						new NumberSequenceKeypoint(0, 0.6, 0),
						new NumberSequenceKeypoint(1, 0.256, 0)
					])
				}
			/>
		</frame>
	)
}
