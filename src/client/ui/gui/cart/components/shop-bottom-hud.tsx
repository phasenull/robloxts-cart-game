import React, { useEffect, useRef } from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { IShopItem } from "shared/type.helper"
import { ClientFunctions } from "shared/network.helper"
import { UIHelper } from "@common/client/ui.helper"
import { __IS_EDIT__ } from "@common/shared/config.builder"
import { A } from "@common/shared/assets"
import { useNavigator } from "@common/client/ui/hooks/useNavigator"
import { useProductPrice } from "@common/client/ui/hooks/useProductPrice"
import { MarketplaceService, Players } from "@rbxts/services"

interface ShopBottomHudProps {
	selectedItem: IShopItem | undefined
	isOwned: boolean
	isEquipped: boolean
	onPurchaseSuccess: () => void
}

export function ShopBottomHud({
	selectedItem,
	isOwned,
	isEquipped,
	onPurchaseSuccess
}: ShopBottomHudProps) {
	const { closeAll } = useNavigator()
	const purchaseButtonRef = useRef<ImageButton>()
	const exitButtonRef = useRef<ImageButton>()

	// Fetch Robux price if item has product_id
	const { priceInRobux, isPending: isPriceLoading } = useProductPrice({
		productId: selectedItem?.product_id,
		enabled: !!selectedItem?.product_id
	})

	// Determine if this is a Robux item
	const isRobuxItem = selectedItem?.product_id !== undefined

	useEffect(() => {
		if (purchaseButtonRef.current) {
			UIHelper.bind(purchaseButtonRef.current)
		}
		if (exitButtonRef.current) {
			UIHelper.bind(exitButtonRef.current)
		}

		return () => {
			if (purchaseButtonRef.current) {
				UIHelper.unbind(purchaseButtonRef.current)
			}
			if (exitButtonRef.current) {
				UIHelper.unbind(exitButtonRef.current)
			}
		}
	}, [])

	const { mutate: mutatePurchase, isPending: isPurchasing } = useMutation({
		mutationFn: async () => {
			if (!selectedItem) return false

			if (__IS_EDIT__) return true

			// Handle Robux purchases
			if (selectedItem.product_id && !isOwned) {
				MarketplaceService.PromptProductPurchase(
					Players.LocalPlayer,
					selectedItem.product_id
				)

				// Wait for purchase to finish
				const [_, __, wasPurchased] =
					MarketplaceService.PromptProductPurchaseFinished.Wait()

				if (wasPurchased) {
					UIHelper.playSound(A.sounds.reward_earned)
					onPurchaseSuccess()
				}

				return wasPurchased
			}

			// Handle cash purchases
			const [success, err] =
				await ClientFunctions.ShopService.makePlayerPurchaseItem.invoke(
					"cart",
					selectedItem.name
				)

			if (err || !success) {
				print(`Purchase failed: ${err || "Unknown error"}`)
				return false
			}

			UIHelper.playSound(A.sounds.reward_earned)
			onPurchaseSuccess()
			return true
		}
	})

	const { mutate: mutateEquip, isPending: isEquipping } = useMutation({
		mutationFn: async () => {
			if (!selectedItem) return false

			if (__IS_EDIT__) return true

			const [success, err] =
				await ClientFunctions.CustomizationService.setPreference.invoke(
					"cart",
					selectedItem.name
				)

			if (err || !success) {
				print(`Equip failed: ${err || "Unknown error"}`)
				return false
			}

			UIHelper.playSound(A.sounds.pop_success)
			onPurchaseSuccess()
			return true
		}
	})

	const canPurchase = selectedItem && !isOwned && !isPurchasing
	const canEquip = selectedItem && isOwned && !isEquipped && !isEquipping
	const isPending = isPurchasing || isEquipping
	const buttonText = isPending
		? isEquipping
			? "Equipping..."
			: "Purchasing..."
		: isEquipped
			? "Equipped"
			: isOwned
				? "Equip"
				: selectedItem
					? "Purchase"
					: "Select Item"
	return (
		<frame
			key="BottomFrame"
			AnchorPoint={new Vector2(0.5, 1)}
			BackgroundTransparency={1}
			Position={new UDim2(0.498, 0, 0.977, 0)}
			Size={new UDim2(0.327, 0, 0.222, 0)}
		>
			<uiaspectratioconstraint AspectRatio={2.6} />
			<imagebutton
				key="Purchase"
				ref={purchaseButtonRef}
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.215, 0, 0.822, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.43, 0, 0.284, 0)}
				Active={
					(canPurchase || canEquip) !== undefined && (canPurchase || canEquip)
				}
				Event={{
					MouseButton1Click: () => {
						if (canPurchase) {
							mutatePurchase()
						} else if (canEquip) {
							mutateEquip()
						}
					}
				}}
			>
				<uistroke 
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1} />
				<frame
					key="Bottom"
					BackgroundColor3={
						canEquip
							? Color3.fromRGB(76, 63, 0)
							: canPurchase
								? Color3.fromRGB(0, 63, 8)
								: Color3.fromRGB(79, 0, 0)
					}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.916, 0)}
					Size={new UDim2(1, 0, 0.084, 0)}
				/>
				<imagelabel
					key="Tile"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://120250412681646"
					ImageTransparency={0.6}
					Position={new UDim2(0.5, 0, 0.477, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.876, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<frame
					key="ColorFrame"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BorderSizePixel={0}
					Position={new UDim2(0.5, 0, 0.457, 0)}
					Size={new UDim2(1, 0, 0.914, 0)}
				>
					<uigradient
						key="Purchase"
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, Color3.fromRGB(193, 252, 0)),
								new ColorSequenceKeypoint(1, Color3.fromRGB(24, 199, 0))
							])
						}
						Rotation={90}
						Enabled={canPurchase}
					/>
					<uigradient
						key="Equip"
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, Color3.fromRGB(255, 230, 0)),
								new ColorSequenceKeypoint(1, Color3.fromRGB(255, 165, 0))
							])
						}
						Rotation={90}
						Enabled={canEquip}
					/>
					<uigradient
						key="Not Enough"
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, Color3.fromRGB(252, 113, 0)),
								new ColorSequenceKeypoint(1, Color3.fromRGB(199, 0, 0))
							])
						}
						Enabled={!canPurchase && !canEquip}
						Rotation={90}
					/>
				</frame>
				<textlabel
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.843, 0, 0.493, 0)}
					Size={new UDim2(0.685, 0, 0.736, 0)}
					Text={buttonText}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke 
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1} />
				</textlabel>
				<uiaspectratioconstraint
					AspectRatio={3.932}
					AspectType={Enum.AspectType.ScaleWithParentSize}
					DominantAxis={Enum.DominantAxis.Height}
				/>
			</imagebutton>
			<imagebutton
				ref={exitButtonRef}
				key="Exit Button"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.782, 0, 0.823, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.432, 0, 0.286, 0)}
				Event={{
					MouseButton1Click: () => {
						task.spawn(() => {
							UIHelper.toggleFade(true)
							task.wait(0.5)
							closeAll()
							task.wait(0.3)
							UIHelper.toggleFade(false)
						})
					}
				}}
			>
				<uistroke 
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1} />
				<frame
					key="Bottom"
					BackgroundColor3={Color3.fromRGB(78, 16, 0)}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.916, 0)}
					Size={new UDim2(1, 0, 0.084, 0)}
				/>
				<imagelabel
					key="Tile"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://120250412681646"
					ImageTransparency={0.6}
					Position={new UDim2(0.5, 0, 0.477, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.876, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<uiaspectratioconstraint
					AspectRatio={3.932}
					AspectType={Enum.AspectType.ScaleWithParentSize}
					DominantAxis={Enum.DominantAxis.Height}
				/>
				<frame
					key="ColorFrame"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BorderSizePixel={0}
					Position={new UDim2(0.5, 0, 0.5, 0)}
					Size={new UDim2(1, 0, 1, 0)}
				>
					<uigradient
						key="Stop"
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, Color3.fromRGB(252, 113, 0)),
								new ColorSequenceKeypoint(1, Color3.fromRGB(199, 0, 0))
							])
						}
						Rotation={90}
					/>
				</frame>
				<textlabel
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.821, 0, 0.466, 0)}
					Size={new UDim2(0.685, 0, 0.726, 0)}
					Text="Exit"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke 
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1} />
				</textlabel>
			</imagebutton>
			<frame
				key="PriceFrame"
				AnchorPoint={new Vector2(0.5, 0)}
				BackgroundColor3={Color3.fromRGB(0, 36, 62)}
				BorderSizePixel={0}
				ClipsDescendants={true}
				Position={new UDim2(0.5, 0, 0, 0)}
				Size={new UDim2(1, 0, 0.575, 0)}
			>
				<uistroke 
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.05} />
				<imagelabel
					key="Tile"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://85705472974218"
					ImageTransparency={0.84}
					Position={new UDim2(0.498, 0, 0.423, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1.004, 0, 1, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<textlabel
					key="Price"
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.842, 0, 0.637, 0)}
					Size={new UDim2(0.684, 0, 0.373, 0)}
					Text={
						!selectedItem
							? "Select an item"
							: isRobuxItem
								? isPriceLoading
									? "Loading..."
									: priceInRobux !== undefined
										? `\u{E002} ${priceInRobux}`
										: "\u{E002} ???"
								: `$ ${selectedItem.price ?? 0}`
					}
					TextColor3={Color3.fromRGB(182, 255, 0)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1} />
				</textlabel>
				<textlabel
					key="Name"
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.827, 0, 0.14, 0)}
					Size={new UDim2(0.658, 0, 0.209, 0)}
					Text={selectedItem?.name || "No Selection"}
					TextColor3={Color3.fromRGB(221, 220, 222)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1}/>
				</textlabel>
				<textlabel
					key="Rarity"
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.827, 0, 0.299, 0)}
					Size={new UDim2(0.658, 0, 0.185, 0)}
					Text={isEquipped ? "Equipped" : isOwned ? "Owned" : "Available"}
					TextColor3={Color3.fromRGB(200, 200, 203)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke 
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1} />
				</textlabel>
				<uigradient
					Rotation={90}
					Transparency={
						new NumberSequence([
							new NumberSequenceKeypoint(0, 0.6, 0),
							new NumberSequenceKeypoint(1, 0.256, 0)
						])
					}
				/>
				<imagelabel
					key="Shadow"
					BackgroundTransparency={1}
					ClipsDescendants={true}
					Image="rbxassetid://75600902046326"
					ImageColor3={Color3.fromRGB(0, 0, 0)}
					ImageTransparency={0.84}
					Position={new UDim2(-0.004, 0, -0.129, 0)}
					Size={new UDim2(1.001, 0, 1.122, 0)}
				/>
				<frame
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.904, 0)}
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
					<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1}/>
					
					<frame
						key="Bottom"
						BackgroundColor3={Color3.fromRGB(0, 0, 0)}
						BackgroundTransparency={0.4}
						BorderSizePixel={0}
						Position={new UDim2(0, 0, 0.921, 0)}
						Size={new UDim2(1, 0, 0.079, 0)}
					/>
					<uigradient
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, Color3.fromRGB(0, 168, 255)),
								new ColorSequenceKeypoint(1, Color3.fromRGB(0, 251, 242))
							])
						}
						Rotation={-90}
					/>
					<imagelabel
						key="Shadow"
						BackgroundTransparency={1}
						ClipsDescendants={true}
						Image="rbxassetid://75600902046326"
						ImageColor3={Color3.fromRGB(0, 0, 0)}
						ImageTransparency={0.84}
						Position={new UDim2(0, 0, -0.091, 0)}
						Size={new UDim2(1.001, 0, 1.081, 0)}
					/>
				</frame>
			</frame>
		</frame>
	)
}
