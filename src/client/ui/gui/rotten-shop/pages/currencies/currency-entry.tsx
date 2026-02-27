import React, { useRef, useEffect } from "@rbxts/react";
import { useMutation, useQuery } from "@rbxts/react-query";
import { MarketplaceService, Players } from "@rbxts/services";
import { UIHelper } from "@common/client/ui.helper";
import { __STUDIO__ } from "@common/client/ui/constants";
import { A } from "@common/shared/assets";

interface CurrencyEntryProps {
	productId: number;
	gradientColors?: [Color3, Color3, Color3];
	layoutOrder?: number;
	onPurchase?: () => void;
}

export function CurrencyEntry({
	productId,
	gradientColors = [
		Color3.fromRGB(78, 115, 239),
		Color3.fromRGB(78, 169, 239),
		Color3.fromRGB(78, 115, 239),
	],
	layoutOrder = 1,
	onPurchase,
}: CurrencyEntryProps) {
	const entryButtonRef = useRef<ImageButton>();

	// Fetch product info from MarketplaceService
	const { data: productInfo, isLoading } = useQuery({
		queryKey: ["product-info", productId],
		queryFn: async () => {
			const info = MarketplaceService.GetProductInfoAsync(
				productId,
				Enum.InfoType.Product,
			) as DeveloperProductInfo;

			return info;
		},
		staleTime: 300_000, // Cache for 5 minutes
	});

	const title = productInfo?.Name ?? "...";
	const price = isLoading
		? "..."
		: productInfo?.PriceInRobux !== undefined
			? `${productInfo.PriceInRobux} R$`
			: "N/A";
	const icon = productInfo?.IconImageAssetId
		? `rbxassetid://${productInfo.IconImageAssetId}`
		: undefined;

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
				onPurchase?.();
			}
			return result;
		},
	});

	useEffect(() => {
		const entryButton = entryButtonRef.current;

		if (entryButton) {
			UIHelper.bind(entryButton, 2);
		}

		return () => {
			if (entryButton) UIHelper.unbind(entryButton);
		};
	}, []);

	const handleClick = () => {
		if (isPromptLoading) return;
		promptPurchase();
	};

	return (
		<imagebutton
			ref={entryButtonRef}
			key="CurrencyEntry"
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			LayoutOrder={layoutOrder}
			Position={new UDim2(0.008, 0, 0.46, 0)}
			Size={new UDim2(1, 0, 1, 0)}
			Event={{
				MouseButton1Click: handleClick,
			}}
		>
			<uistroke
				StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				Thickness={0.03}
			/>
			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, gradientColors[0]),
						new ColorSequenceKeypoint(0.5, gradientColors[1]),
						new ColorSequenceKeypoint(1, gradientColors[2]),
					])
				}
				Offset={new Vector2(-0.15, 0)}
				Rotation={90}
			/>
			<imagelabel
				key="Shadow"
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.84}
				Position={new UDim2(0, 0, 0.008, 0)}
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
			<imagebutton
				key="Buy"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.551, 0, 0.753, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.419, 0, 0.218, 0)}
				ZIndex={45}
				Active={!isPromptLoading}
				Event={{
					MouseButton1Click: handleClick,
				}}
			>
				<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Thickness={0.05} />
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(62, 216, 40)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(171, 248, 71)),
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
							Enum.FontStyle.Normal,
						)
					}
					Position={new UDim2(0.182, 0, 0.123, 0)}
					Size={new UDim2(0.636, 0, 0.754, 0)}
					Text={price}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Thickness={0.05} />
				</textlabel>
			</imagebutton>
			{icon !== undefined && icon !== "" && (
				<imagelabel
					key="Icon"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image={icon}
					Position={new UDim2(0.4, 0, 0.5, 0)}
					ScaleType={Enum.ScaleType.Fit}
					Size={new UDim2(0.9, 0, 0.9, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
					ZIndex={6}
				>
					<uiaspectratioconstraint />
				</imagelabel>
			)}
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Size={new UDim2(1, 0, 0.135, 0)}
				ZIndex={7}
			>
				<textlabel
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
					Position={new UDim2(0.913, 0, 0.5, 0)}
					Size={new UDim2(0.8260000000000001, 0, 0.782, 0)}
					Text={title}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Thickness={0.1} />
				</textlabel>
			</frame>
		</imagebutton>
	);
}
