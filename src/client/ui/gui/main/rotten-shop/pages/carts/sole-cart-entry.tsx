import React, { useRef, useEffect } from "@rbxts/react"
import { useMutation, useQuery } from "@rbxts/react-query"
import { MarketplaceService, Players } from "@rbxts/services"
import { UIHelper } from "client/ui.helper"
import { __STUDIO__ } from "client/ui/constants"
import { ViewportHelper } from "client/ui/components/viewport-helper"
import { useCartModel } from "client/ui/gui/cart/hooks/useCartModel"
import { useCartProductId } from "client/ui/hooks/useCartProductId"
import { useProductPrice } from "client/ui/hooks/useProductPrice"
import { __IS_EDIT__ } from "shared/config.helper"
import { ClientFunctions } from "shared/network.helper"
import { A } from "shared/assets"

interface SoleCartEntryProps {
	cartName: string
	description: string
	backgroundImage?: string
	backgroundImageColor?: Color3
	layoutOrder?: number
	textChildren?: React.ReactNode
}

export function SoleCartEntry({
	cartName,
	description,
	backgroundImage = "rbxassetid://119921518737471",
	backgroundImageColor = Color3.fromRGB(147, 201, 255),
	layoutOrder,
	textChildren
}: SoleCartEntryProps) {
	const entryButtonRef = useRef<ImageButton>()

	// Get product_id from cart name
	const productId = useCartProductId(cartName)

	// Check if player owns this cart
	const { data: is_owned = false, refetch: refetchOwned } = useQuery({
		queryKey: ["cart-owned", cartName],
		queryFn: async () => {
			if (__IS_EDIT__) return false
			const [owned, err] = await ClientFunctions.ShopService.doesPlayerOwnItem.invoke("cart", cartName)
			if (err) return false
			return owned as boolean
		}
	})

	// Fetch price from MarketplaceService
	const { priceInRobux, isLoading } = useProductPrice({
		productId,
		enabled: !is_owned
	})

	// Format price display
	const priceText = isLoading
		? "..."
		: priceInRobux !== undefined
			? `${priceInRobux} R$`
			: "N/A"

	const { isLoading: isPromptLoading, mutate: promptPurchase } = useMutation({
		mutationFn: async (args: { productId: number }) => {
			MarketplaceService.PromptProductPurchase(Players.LocalPlayer, args.productId)
			let result = false
			if (__STUDIO__) {
				task.wait(1)
				result = true
			} else {
				const [_, __, new_result] = MarketplaceService.PromptProductPurchaseFinished.Wait()
				result = new_result
			}
			if (result) {
				UIHelper.playSound(A.sounds.purchase_success)
				refetchOwned()
			}
			return result
		}
	})

	const model = useCartModel(cartName, true)
	model?.FindFirstChild("HandBrake")?.Destroy()
	model?.FindFirstChild("Honk")?.Destroy()

	const handleBuyClick = () => {
		if (is_owned || isPromptLoading || !productId) {
			UIHelper.playSound(A.sounds.error)
			return
		}
		promptPurchase({ productId })
	}

	useEffect(() => {
		const entryButton = entryButtonRef.current

		if (entryButton) {
			UIHelper.bind(entryButton, 2)
		}

		return () => {
			if (entryButton) UIHelper.unbind(entryButton)
		}
	}, [is_owned])

	if (!model) {
		return
	}
	return (
		<imagebutton
			ref={entryButtonRef}
			key="SoleCartEntry"
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			LayoutOrder={layoutOrder}
			Position={new UDim2(0.015, 0, 0.073, 0)}
			Size={new UDim2(0.31, 0, 1, 0)}
			Event={{
				MouseButton1Click: handleBuyClick
			}}
		>
			<uiaspectratioconstraint AspectRatio={0.862} />
			<uistroke Thickness={5} />
			<imagelabel
				key="Shadow"
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.84}
				Size={new UDim2(1, 0, 1, 0)}
				ZIndex={0}
			/>
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://120250412681646"
				ImageTransparency={0.7000000000000001}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 1, 0)}
				TileSize={new UDim2(0, 50, 0, 50)}
				ZIndex={0}
			/>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Size={new UDim2(1, 0, 0.091, 0)}
				ZIndex={5}
			>
				<textlabel
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.913, 0, 0.5, 0)}
					Size={new UDim2(0.8260000000000001, 0, 0.782, 0)}
					Text={cartName}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke Thickness={3} />
				</textlabel>
			</frame>
			<imagebutton
				key="Buy"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.045, 0, 0.836, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.891, 0, 0.138, 0)}
				ZIndex={45}
				Active={!is_owned && !isPromptLoading}
				Event={{
					MouseButton1Click: handleBuyClick
				}}
			>
				<uistroke Thickness={5} />
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(
								0,
								is_owned
									? Color3.fromRGB(100, 100, 100)
									: Color3.fromRGB(62, 216, 40)
							),
							new ColorSequenceKeypoint(
								1,
								is_owned
									? Color3.fromRGB(150, 150, 150)
									: Color3.fromRGB(171, 248, 71)
							)
						])
					}
					Rotation={-90}
				/>
				<frame
					key="Bottom"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.921, 0)}
					Size={new UDim2(1, 0, 0.079, 0)}
				/>
				<imagelabel
					key="Tile"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://120250412681646"
					ImageTransparency={0.6}
					Position={new UDim2(0.5, 0, 0.461, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.921, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<textlabel
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.182, 0, 0.123, 0)}
					Size={new UDim2(0.636, 0, 0.754, 0)}
					Text={is_owned ? "OWNED" : priceText}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke Thickness={4} />
				</textlabel>
			</imagebutton>
			<textlabel
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				FontFace={
					new Font(
						"rbxasset://fonts/families/GothamSSm.json",
						Enum.FontWeight.Heavy,
						Enum.FontStyle.Normal
					)
				}
				Position={new UDim2(0.034, 0, 0.7, 0)}
				Size={new UDim2(0.93, 0, 0.1, 0)}
				Text={description}
				RichText={true}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				ZIndex={4}
			>
				{textChildren}
				<uistroke Thickness={3} />
			</textlabel>
			<imagelabel
				key="Backgroundimage"
				BackgroundTransparency={1}
				ClipsDescendants={true}
				Image={backgroundImage}
				ImageColor3={backgroundImageColor}
				Position={new UDim2(0, 0, 0, 0)}
				Size={new UDim2(1, 0, 1, 0)}
				ZIndex={0}
				ScaleType={Enum.ScaleType.Crop}
			>
				<uigradient
					Rotation={-90}
					Transparency={
						new NumberSequence([
							new NumberSequenceKeypoint(0, 0, 0),
							new NumberSequenceKeypoint(1, 0.581, 0)
						])
					}
				/>
			</imagelabel>
			<ViewportHelper
			position={new UDim2(0, 0, -0.1, 0)}
				model={model}
				fieldOfView={50}
				cameraDistance={15}
				autoFit={true}
				modelOffset={new CFrame(0, 5, 0).mul(CFrame.Angles(math.rad(10), math.rad(180), 0))}
				lightDirection={Vector3.zero}
				enableRotationAnimation={true}
				rotationSpeed={30}
				rotationAxis="Y"
				rotateCameraInsteadOfModel={true}
			/>
		</imagebutton>
	)
}
