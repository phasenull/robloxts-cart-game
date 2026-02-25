import React from "@rbxts/react";
import { useMutation, useQuery } from "@rbxts/react-query";
import { MarketplaceService, Players } from "@rbxts/services";
import { UIHelper } from "client/ui.helper";
import { __STUDIO__, UIDIM } from "client/ui/constants";
import { ViewportHelper } from "client/ui/components/viewport-helper";
import { useCartModel } from "client/ui/gui/cart/hooks/useCartModel";
import { A } from "shared/assets";
import { ClientFunctions } from "shared/network.helper";
import { useBundleData } from "client/ui/hooks/useBundleData";
import { capitalizeFirstLetter } from "shared/util.helper";
import { getRewardDisplay } from "shared/cart.helper";
import { __IS_EDIT__ } from "shared/config.helper";

export interface GlitchBundleEntryProps {
	productId: number;
	cartName: string;
	discountPercentage?: number;
	onBuy?: () => void;
}

export function GlitchBundleEntry(props: GlitchBundleEntryProps) {
	const { productId, cartName, discountPercentage } = props;
	const { data: productInfo, isLoading } = useQuery({
		queryKey: ["product-info", productId],
		queryFn: async () => {
			const info = MarketplaceService.GetProductInfoAsync(
				productId,
				Enum.InfoType.Product,
			) as DeveloperProductInfo;
			return info;
		},
		staleTime: 300_000,
	});

	const { data: is_owned = false, refetch: refetchOwned } = useQuery({
		queryKey: ["cart-owned", cartName],
		queryFn: async () => {
			if (__IS_EDIT__) return false;
			const [owned, err] =
				await ClientFunctions.ShopService.doesPlayerOwnItem.invoke(
					"cart",
					cartName,
				);
			if (err) return false;
			return owned as boolean;
		},
	});

	const bundleTitle = productInfo?.Name ?? "...";
	const priceInRobux = productInfo?.PriceInRobux;
	const priceText = isLoading
		? "..."
		: priceInRobux !== undefined
			? `${priceInRobux} R$`
			: "N/A";

	const { isLoading: isPromptLoading, mutate: promptPurchase } = useMutation({
		mutationFn: async () => {
			MarketplaceService.PromptProductPurchase(Players.LocalPlayer, productId);
			let result = false;
			if (__STUDIO__) {
				task.wait(1);
				result = true;
			} else {
				const [_, __, new_result] =
					MarketplaceService.PromptProductPurchaseFinished.Wait();
				result = new_result;
			}
			if (result) {
				UIHelper.playSound(A.sounds.purchase_success);
				refetchOwned();
				props.onBuy?.();
			}
			return result;
		},
	});

	const handleBuyClick = () => {
		if (is_owned || isPromptLoading) {
			UIHelper.playSound(A.sounds.error);
			return;
		}
		promptPurchase();
	};

	const model = useCartModel(cartName, true);
	model?.FindFirstChild("HandBrake")?.Destroy();
	model?.FindFirstChild("Honk")?.Destroy();
	const bundleData = useBundleData(productId);
	const rewards = (bundleData?.rewards ?? []) as Array<{
		type: string;
		value: number;
	}>;

	return (
		<frame
			key="GlitchBundleEntry"
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			Size={new UDim2(0.99, 0, 0.491, 0)}
			Position={UDim2.fromScale(0.005, 0)}
		>
			<uistroke
				StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				Thickness={0.02}
			/>
			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, Color3.fromRGB(255, 0, 0)),
						new ColorSequenceKeypoint(0.166, Color3.fromRGB(255, 255, 0)),
						new ColorSequenceKeypoint(0.33, Color3.fromRGB(0, 255, 0)),
						new ColorSequenceKeypoint(0.5, Color3.fromRGB(0, 255, 255)),
						new ColorSequenceKeypoint(0.66, Color3.fromRGB(0, 0, 255)),
						new ColorSequenceKeypoint(0.833, Color3.fromRGB(255, 0, 255)),
						new ColorSequenceKeypoint(1, Color3.fromRGB(255, 0, 0)),
					])
				}
				Enabled={false}
			/>
			<frame
				key="List"
				BackgroundTransparency={1}
				Position={new UDim2(0.01, 0, 0.19, 0)}
				Size={new UDim2(0.96, 0, 0.73, 0)}
				ZIndex={6}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0.05, 0)}
					SortOrder={Enum.SortOrder.LayoutOrder}
					VerticalAlignment={Enum.VerticalAlignment.Center}
				/>
				<uipadding PaddingLeft={new UDim(0.02, 0)} />
				{model && (
					<frame
						key="BundleItem1"
						BackgroundColor3={Color3.fromRGB(0, 0, 0)}
						BackgroundTransparency={0.55}
						BorderSizePixel={0}
						Size={new UDim2(0.3, 0, 1, 0)}
						ZIndex={6}
						LayoutOrder={-1}
					>
						<uiaspectratioconstraint />
						<uistroke
							StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
							Thickness={0.02}
						/>
						<textlabel
							AnchorPoint={new Vector2(0.5, 1)}
							BackgroundTransparency={1}
							Font={Enum.Font.GothamBlack}
							FontFace={
								new Font(
									"rbxasset://fonts/families/GothamSSm.json",
									Enum.FontWeight.Heavy,
									Enum.FontStyle.Normal,
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
							<uistroke
								StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
								Thickness={0.1}
							/>
						</textlabel>
						<ViewportHelper
							model={model}
							position={new UDim2(0.5, 0, 0.5, 0)}
							anchorPoint={UIDIM.A_CENTER}
							size={new UDim2(0.9, 0, 0.9, 0)}
							fieldOfView={50}
							autoFit={true}
							modelOffset={new CFrame(0, 5, 0).mul(
								CFrame.Angles(math.rad(10), math.rad(180), 0),
							)}
							lightDirection={Vector3.zero}
							enableRotationAnimation={true}
							rotationSpeed={30}
							rotationAxis="Y"
							rotateCameraInsteadOfModel={true}
							zIndex={6}
						>
							<uiaspectratioconstraint AspectRatio={1} />
						</ViewportHelper>
					</frame>
				)}
				<frame
					key="RewardsGrid"
					BackgroundTransparency={1}
					Size={new UDim2(0.8, 0, 1, 0)}
					ZIndex={6}
				>
					<uigridlayout
						CellSize={new UDim2(0.63, 0, 0.63, 0)}
						CellPadding={new UDim2(0.06, 0, 0.06, 0)}
						SortOrder={Enum.SortOrder.LayoutOrder}
						HorizontalAlignment={Enum.HorizontalAlignment.Left}
					>
						<uiaspectratioconstraint AspectRatio={1} />
					</uigridlayout>
					{rewards.map((reward, i) => {
						if (reward.type === "cart") return;
						const { countText, nameText, image_id } = getRewardDisplay(reward);
						return (
							<frame
								key={`RewardItem${i}`}
								BackgroundColor3={Color3.fromRGB(0, 0, 0)}
								BackgroundTransparency={0.55}
								BorderSizePixel={0}
								ZIndex={6}
							>
								<uistroke
									StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
									Thickness={0.05}
								/>
								{!!image_id && (
									<imagelabel
										key="Icon"
										AnchorPoint={new Vector2(0.5, 0.5)}
										BackgroundTransparency={1}
										Image={image_id}
										Position={new UDim2(0.5, 0, 0.4, 0)}
										Size={new UDim2(0.55, 0, 0.55, 0)}
										ScaleType={Enum.ScaleType.Fit}
										ZIndex={7}
									/>
								)}
								<textlabel
									BackgroundTransparency={1}
									Font={Enum.Font.GothamBlack}
									FontFace={
										new Font(
											"rbxasset://fonts/families/GothamSSm.json",
											Enum.FontWeight.Heavy,
											Enum.FontStyle.Normal,
										)
									}
									Position={new UDim2(-0.112, 0, -0.141, 0)}
									Rotation={-6}
									Size={new UDim2(0.641, 0, 0.37, 0)}
									Text={countText}
									TextColor3={Color3.fromRGB(255, 255, 255)}
									TextScaled={true}
									TextSize={14}
									TextWrapped={true}
									TextXAlignment={Enum.TextXAlignment.Left}
									ZIndex={8}
								>
									<uistroke
										StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
										Thickness={0.05}
									/>
								</textlabel>
								<textlabel
									BackgroundTransparency={1}
									Font={Enum.Font.GothamBlack}
									FontFace={
										new Font(
											"rbxasset://fonts/families/GothamSSm.json",
											Enum.FontWeight.Heavy,
											Enum.FontStyle.Normal,
										)
									}
									Position={new UDim2(0.087, 0, 0.629, 0)}
									Size={new UDim2(0.809, 0, 0.37, 0)}
									Text={nameText}
									TextColor3={Color3.fromRGB(255, 255, 255)}
									TextScaled={true}
									TextSize={14}
									TextWrapped={true}
									ZIndex={8}
								>
									<uistroke
										StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
										Thickness={0.05}
									/>
								</textlabel>
								<uigradient
									Rotation={-90}
									Transparency={
										new NumberSequence([
											new NumberSequenceKeypoint(0, 0, 0),
											new NumberSequenceKeypoint(1, 0.581, 0),
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
						);
					})}
				</frame>
			</frame>
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
							Enum.FontStyle.Normal,
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
					<uistroke
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.05}
					/>
				</textlabel>
				<textlabel
					key="Save Text"
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal,
						)
					}
					Position={new UDim2(0.991, 0, 0.492, 0)}
					Size={new UDim2(0.468, 0, 0.625, 0)}
					Text={
						discountPercentage !== undefined
							? `Sale %${discountPercentage}!`
							: ""
					}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					TextXAlignment={Enum.TextXAlignment.Right}
					Visible={discountPercentage !== undefined}
				>
					<uistroke
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.05}
					/>
					<uigradient
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, Color3.fromRGB(255, 144, 0)),
								new ColorSequenceKeypoint(1, Color3.fromRGB(255, 255, 0)),
							])
						}
					/>
				</textlabel>
			</frame>
			{priceInRobux !== undefined && (
				<textlabel
					key="OriginalPrice"
					AnchorPoint={new Vector2(0.5, 1)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal,
						)
					}
					Position={new UDim2(0.857, 0, 0.717, 0)}
					RichText={true}
					Rotation={-5}
					Size={new UDim2(0.235, 0, 0.12, 0)}
					Text={`${priceInRobux * 2} R$`}
					TextColor3={Color3.fromRGB(255, 100, 100)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					ZIndex={6}
				>
					<frame
						BorderSizePixel={0}
						BackgroundColor3={Color3.fromRGB(200, 20, 20)}
						Size={UDim2.fromScale(0.6, 0.15)}
						AnchorPoint={UIDIM.A_CENTER}
						Position={UIDIM.CENTER}
					/>
					<uistroke
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.05}
					/>
				</textlabel>
			)}
			<imagebutton
				key="Buy"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.74, 0, 0.717, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.235, 0, 0.205, 0)}
				ZIndex={5}
				Active={!is_owned && !isPromptLoading}
				Event={{
					MouseButton1Click: handleBuyClick,
				}}
			>
				<uistroke
					StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Thickness={0.05}
				/>
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(
								0,
								is_owned
									? Color3.fromRGB(100, 100, 100)
									: Color3.fromRGB(255, 148, 0),
							),
							new ColorSequenceKeypoint(
								1,
								is_owned
									? Color3.fromRGB(150, 150, 150)
									: Color3.fromRGB(247, 248, 148),
							),
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
					Position={new UDim2(0.526, 0, 0.461, 0)}
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
							Enum.FontStyle.Normal,
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
					<uistroke
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.05}
					/>
				</textlabel>
			</imagebutton>
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
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0, 0, 1.026, 0)}
				Size={new UDim2(0.013000000000000001, 0, -0.845, 0)}
				ZIndex={5}
			/>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0.985, 0, 1.026, 0)}
				Size={new UDim2(0.013000000000000001, 0, -0.845, 0)}
				ZIndex={5}
			/>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0.985, 0, 1.0230000000000001, 0)}
				Size={new UDim2(-0.972, 0, -0.059000000000000004, 0)}
				ZIndex={5}
			/>
			<textlabel
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				FontFace={
					new Font(
						"rbxasset://fonts/families/GothamSSm.json",
						Enum.FontWeight.Heavy,
						Enum.FontStyle.Normal,
					)
				}
				Position={new UDim2(0.719, 0, -0.10200000000000001, 0)}
				Rotation={-10}
				Size={new UDim2(0.253, 0, 0.191, 0)}
				Text="%50 FREE"
				TextColor3={Color3.fromRGB(255, 0, 0)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				ZIndex={50}
			>
				<uistroke
					StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Thickness={0.05}
				/>
			</textlabel>
			<imagelabel
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Image="rbxassetid://1412150157"
				ScaleType={Enum.ScaleType.Crop}
				Size={new UDim2(1, 0, 1, 0)}
			/>
			<canvasgroup
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				GroupColor3={Color3.fromRGB(115, 255, 0)}
				GroupTransparency={0.19}
				Size={new UDim2(1, 0, 1, 0)}
			>
				<videoframe
					BackgroundTransparency={1}
					Looped={true}
					Playing={true}
					Size={new UDim2(1, 0, 1, 0)}
					TimePosition={24.240000000000002}
					Video="rbxassetid://5608411652"
					Volume={0}
				/>
			</canvasgroup>
		</frame>
	);
}
