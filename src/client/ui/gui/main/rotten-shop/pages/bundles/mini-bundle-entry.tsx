import React from "@rbxts/react"
import { useMutation, useQuery } from "@rbxts/react-query"
import { MarketplaceService, Players } from "@rbxts/services"
import { UIHelper } from "client/ui.helper"
import { __STUDIO__ } from "client/ui/constants"
import { ViewportHelper } from "client/ui/components/viewport-helper"
import { useCartModel } from "client/ui/gui/cart/hooks/useCartModel"
import { A } from "shared/assets"
import { ClientFunctions } from "shared/network.helper"
import { __IS_EDIT__ } from "shared/config.helper"

export interface MiniBundleEntryProps {
	productId: number
	cartName: string
	side: "left" | "right"
	leftItem?: {
		name: string
		quantity: number
		image?: string
	}
	rightItem?: {
		name: string
		quantity: number
		image?: string
	}
	onBuy?: () => void
}

export function MiniBundleEntry(props: MiniBundleEntryProps) {
	const { productId, cartName, side, leftItem, rightItem } = props
	const x_anchor = side === "left" ? 0 : 1
	const { data: productInfo, isLoading } = useQuery({
		queryKey: ["product-info", productId],
		queryFn: async () => {
			const info = MarketplaceService.GetProductInfoAsync(
				productId,
				Enum.InfoType.Product
			) as DeveloperProductInfo
			return info
		},
		staleTime: 300_000
	})

	const { data: is_owned = false, refetch: refetchOwned } = useQuery({
		queryKey: ["cart-owned", cartName],
		queryFn: async () => {
			if (__IS_EDIT__) return false
			const [owned, err] = await ClientFunctions.ShopService.doesPlayerOwnItem.invoke("cart", cartName)
			if (err) return false
			return owned as boolean
		}
	})

	const bundleTitle = productInfo?.Name ?? "..."
	const priceInRobux = productInfo?.PriceInRobux
	const priceText = isLoading ? "..." : priceInRobux !== undefined ? `${priceInRobux} R$` : "N/A"

	const { isLoading: isPromptLoading, mutate: promptPurchase } = useMutation({
		mutationFn: async () => {
			MarketplaceService.PromptProductPurchase(Players.LocalPlayer, productId)
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
				props.onBuy?.()
			}
			return result
		}
	})

	const handleBuyClick = () => {
		if (is_owned || isPromptLoading) {
			UIHelper.playSound(A.sounds.error)
			return
		}
		promptPurchase()
	}


	const model = useCartModel(cartName, true)
	model?.FindFirstChild("HandBrake")?.Destroy()
	model?.FindFirstChild("Honk")?.Destroy()

	return (
		<frame
			key="MiniBundleEntry"
			AnchorPoint={new Vector2(x_anchor, 1)}
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			LayoutOrder={2}
			Position={new UDim2(x_anchor === 0 ? 0.005 : .995, 0, 1, 0)}
			Size={new UDim2(0.48, 0, 0.45, 0)}
		>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Size={new UDim2(1, 0, 0.181, 0)}
				ZIndex={5}
			>
				<textlabel
					key="Label"
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
					Position={new UDim2(0.481, 0, 0.481, 0)}
					Size={new UDim2(0.468, 0, 0.782, 0)}
					Text={bundleTitle}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					TextXAlignment={Enum.TextXAlignment.Left}
				>
					<uistroke Thickness={3} />
				</textlabel>
			</frame>
			<imagelabel
				key="Beam"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://117283961854969"
				ImageTransparency={0.5}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(2, 0, 2, 0)}
				ZIndex={0}
			/>
			<imagelabel
				key="Shadow"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.7000000000000001}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				Size={new UDim2(1.0010000000000001, 0, 1.088, 0)}
				ZIndex={0}
			/>
			<uistroke Thickness={5} />
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://120250412681646"
				ImageTransparency={0.6}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 1, 0)}
				TileSize={new UDim2(0, 75, 0, 75)}
			/>
			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, Color3.fromRGB(239, 35, 35)),
						new ColorSequenceKeypoint(1, Color3.fromRGB(203, 28, 28))
					])
				}
				Offset={new Vector2(-0.15, 0)}
				Rotation={90}
			/>
			<frame
				key="List"
				BackgroundTransparency={1}
				Position={new UDim2(0.108, 0, 0.25, 0)}
				Size={new UDim2(0.8170000000000001, 0, 0.6930000000000001, 0)}
				ZIndex={6}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					Padding={new UDim(0.1, 0)}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				<frame
					key="MainItem"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.55}
					BorderSizePixel={0}
					LayoutOrder={2}
					Size={new UDim2(0.5, 0, 1, 0)}
				>
					<uistroke Thickness={4} />
					<uiaspectratioconstraint />
					<textlabel
						AnchorPoint={new Vector2(0.5, 1)}
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(0.5, 0, 1, 0)}
						Size={new UDim2(0.9, 0, 0.12, 0)}
						Text={cartName}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
						ZIndex={10}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<uigradient
						Rotation={-90}
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 0, 0),
								new NumberSequenceKeypoint(1, 0.581, 0)
							])
						}
					/>
					<imagelabel
						key="Shadow"
						BackgroundTransparency={1}
						Image="rbxassetid://75600902046326"
						ImageColor3={Color3.fromRGB(0, 0, 0)}
						ImageTransparency={0.84}
						Size={new UDim2(1, 0, 1, 0)}
						ZIndex={5}
					/>
					{model && (
						<ViewportHelper
							model={model}
							size={new UDim2(1, 0, 1, 0)}
							position={new UDim2(0, 0, 0, 0)}
							fieldOfView={70}
							autoFit={true}
							modelOffset={new CFrame(0, 5, 0).mul(CFrame.Angles(math.rad(10), math.rad(180), 0))}
							lightDirection={Vector3.zero}
							enableRotationAnimation={true}
							rotationSpeed={30}
							rotationAxis="Y"
							rotateCameraInsteadOfModel={true}
							zIndex={6}
						/>
					)}
				</frame>
				<frame
					key="LeftItemContainer"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.55}
					BorderSizePixel={0}
					LayoutOrder={4}
					Position={new UDim2(0.39, 0, 0.274, 0)}
					SelectionOrder={1}
					Size={new UDim2(0.22, 0, 0.501, 0)}
				>
					<uistroke Thickness={4} />
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
						Position={new UDim2(-0.112, 0, -0.14100000000000001, 0)}
						Rotation={-6}
						Size={new UDim2(0.641, 0, 0.37, 0)}
						Text={leftItem !== undefined ? `x${leftItem.quantity}` : "x1"}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
						TextXAlignment={Enum.TextXAlignment.Left}
					>
						<uistroke Thickness={3} />
					</textlabel>
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
						Position={new UDim2(0.08700000000000001, 0, 0.629, 0)}
						Size={new UDim2(0.809, 0, 0.37, 0)}
						Text={leftItem?.name ?? "?"}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<imagelabel
						BackgroundTransparency={1}
						Image={leftItem?.image ?? ""}
						Position={new UDim2(0.051000000000000004, 0, 0.06, 0)}
						Size={new UDim2(0.896, 0, 0.879, 0)}
						ZIndex={0}
					>
						<uiaspectratioconstraint />
					</imagelabel>
					<uiaspectratioconstraint />
					<uigradient
						Rotation={-90}
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 0, 0),
								new NumberSequenceKeypoint(1, 0.581, 0)
							])
						}
					/>
					<imagelabel
						key="Shadow"
						BackgroundTransparency={1}
						Image="rbxassetid://75600902046326"
						ImageColor3={Color3.fromRGB(0, 0, 0)}
						ImageTransparency={0.84}
						Size={new UDim2(1, 0, 1, 0)}
						ZIndex={5}
					/>
				</frame>
				<frame
					key="RightItemContainer"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.55}
					BorderSizePixel={0}
					LayoutOrder={6}
					Position={new UDim2(0.705, 0, 0.274, 0)}
					SelectionOrder={1}
					Size={new UDim2(0.22, 0, 0.501, 0)}
				>
					<uistroke Thickness={4} />
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
						Position={new UDim2(-0.112, 0, -0.14100000000000001, 0)}
						Rotation={-6}
						Size={new UDim2(0.641, 0, 0.37, 0)}
						Text={rightItem !== undefined ? `x${rightItem.quantity}` : "x1"}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
						TextXAlignment={Enum.TextXAlignment.Left}
					>
						<uistroke Thickness={3} />
					</textlabel>
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
						Position={new UDim2(0.08700000000000001, 0, 0.629, 0)}
						Size={new UDim2(0.809, 0, 0.37, 0)}
						Text={rightItem?.name ?? "?"}
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<imagelabel
						BackgroundTransparency={1}
						Image={rightItem?.image ?? ""}
						Position={new UDim2(0.051000000000000004, 0, 0.06, 0)}
						Size={new UDim2(0.896, 0, 0.879, 0)}
						ZIndex={0}
					>
						<uiaspectratioconstraint />
					</imagelabel>
					<uiaspectratioconstraint />
					<uigradient
						Rotation={-90}
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 0, 0),
								new NumberSequenceKeypoint(1, 0.581, 0)
							])
						}
					/>
					<imagelabel
						key="Shadow"
						BackgroundTransparency={1}
						Image="rbxassetid://75600902046326"
						ImageColor3={Color3.fromRGB(0, 0, 0)}
						ImageTransparency={0.84}
						Size={new UDim2(1, 0, 1, 0)}
						ZIndex={5}
					/>
				</frame>
			</frame>
			<frame
				key="__visuals"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0.985, 0, 1.0230000000000001, 0)}
				Size={new UDim2(-0.972, 0, -0.059000000000000004, 0)}
				ZIndex={5}
			/>
			<frame
				key="__visuals"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0.985, 0, 1.026, 0)}
				Size={new UDim2(0.013000000000000001, 0, -0.845, 0)}
				ZIndex={5}
			/>
			<frame
				key="__visuals"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0, 0, 1.026, 0)}
				Size={new UDim2(0.013000000000000001, 0, -0.845, 0)}
				ZIndex={5}
			/>
			<imagebutton
				key="Buy"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.8300000000000001, 0, 0.85, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.289, 0, 0.181, 0)}
				ZIndex={5}
				Active={!is_owned && !isPromptLoading}
				Event={{
					MouseButton1Click: handleBuyClick
				}}
			>
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
					Position={new UDim2(0.47200000000000003, 0, 0.422, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.921, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<textlabel
					key="Price_Text"
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.181, 0, 0.167, 0)}
					Size={new UDim2(0.636, 0, 0.5760000000000001, 0)}
					Text={is_owned ? "OWNED" : priceText}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke Thickness={3} />
				</textlabel>
				<uistroke Thickness={5.1000000000000005} />
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(
								0,
								is_owned
									? Color3.fromRGB(100, 100, 100)
									: Color3.fromRGB(255, 148, 0)
							),
							new ColorSequenceKeypoint(
								1,
								is_owned
									? Color3.fromRGB(150, 150, 150)
									: Color3.fromRGB(247, 248, 148)
							)
						])
					}
					Rotation={-90}
				/>
			</imagebutton>
		</frame>
	)
}
