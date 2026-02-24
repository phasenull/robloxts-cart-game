import React, { useEffect, useRef } from "@rbxts/react";
import { IShopItem } from "shared/type.helper";
import { useProductPrice } from "client/ui/hooks/useProductPrice";
import { useCartModel } from "../hooks/useCartModel";
import { Workspace } from "@rbxts/services";

interface ShopCartEntryProps {
	item: IShopItem;
	isSelected: boolean;
	isOwned: boolean;
	isEquipped: boolean;
	onClick: () => void;
}

export function ShopCartEntry({
	item,
	isSelected,
	isOwned,
	isEquipped,
	onClick,
}: ShopCartEntryProps) {
	// Fetch Robux price if item has product_id
	const { priceInRobux, isLoading: isPriceLoading } = useProductPrice({
		productId: item.product_id,
		enabled: !!item.product_id && !isOwned,
	});

	// Determine display price and colors
	let displayPrice: string;
	let textColor: Color3;
	const model = useCartModel(item.name);
	if (isEquipped) {
		displayPrice = "EQUIPPED";
		textColor = Color3.fromRGB(255, 215, 0);
	} else if (isOwned) {
		displayPrice = "OWNED";
		textColor = Color3.fromRGB(150, 255, 150);
	} else if (item.product_id !== undefined) {
		// Robux item
		if (isPriceLoading) {
			displayPrice = "...";
		} else if (priceInRobux !== undefined) {
			displayPrice = `\u{E002} ${priceInRobux}`;
		} else {
			displayPrice = "\u{E002} ???";
		}
		textColor = Color3.fromRGB(255, 255, 255);
	} else {
		// Cash item
		displayPrice = `$${item.price ?? 0}`;
		textColor = Color3.fromRGB(255, 255, 255);
	}

	const bgColor = isOwned
		? Color3.fromRGB(100, 200, 100)
		: isSelected
			? Color3.fromRGB(255, 200, 0)
			: Color3.fromRGB(255, 92, 224);
	const vpf = useRef<ViewportFrame>(undefined);

	if (vpf.current && model) {
		model.Parent = vpf.current;
		const camera =
			(Workspace.FindFirstChild("ViewportFrameCamera") as Camera) ||
			new Instance("Camera", Workspace);
		camera.Name = "ViewportFrameCamera";
		assert(camera, "Camera not found in workspace");
		vpf.current.CurrentCamera = camera;
		model.PivotTo(
			camera.CFrame.mul(new CFrame(0, 1, -7)).mul(
				CFrame.Angles(math.rad(20), math.rad(-130), 0),
			),
		);
	}
	return (
		<imagebutton
			key="CartEntry"
			Active={true}
			BackgroundColor3={bgColor}
			BackgroundTransparency={isOwned ? 0.2 : 0.35}
			BorderSizePixel={0}
			Size={new UDim2(0.227, 0, 0.18, 0)}
			// ZIndex={isSelected ? 10 : 5}
			Event={{
				MouseButton1Click: onClick,
			}}
		>
			<textlabel
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				Position={new UDim2(0.066, 0, -0.003, 0)}
				Size={new UDim2(0.871, 0, 0.211, 0)}
				Text={item.name}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				ZIndex={5}
			>
				<uistroke
					StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Thickness={0.01}
				/>
			</textlabel>
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://120250412681646"
				ImageTransparency={0.9}
				Position={new UDim2(0.496, 0, 0.534, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 0.921, 0)}
				TileSize={new UDim2(0, 50, 0, 50)}
			/>
			<uistroke
				StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				Thickness={isSelected ? 0.02 : 0.01}
				Transparency={isSelected ? 0 : 0.14}
			/>
			<uiaspectratioconstraint
				AspectType={Enum.AspectType.ScaleWithParentSize}
				DominantAxis={Enum.DominantAxis.Height}
			/>
			<textlabel
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				Position={new UDim2(0.24, 0, 0.75, 0)}
				Size={new UDim2(0.756, 0, 0.252, 0)}
				Text={displayPrice}
				TextColor3={textColor}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				TextXAlignment={Enum.TextXAlignment.Right}
				ZIndex={5}
			>
				<uistroke Thickness={2} />
			</textlabel>
			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, Color3.fromRGB(170, 169, 170)),
						new ColorSequenceKeypoint(1, Color3.fromRGB(255, 255, 255)),
					])
				}
				Rotation={-90}
			/>
			<frame
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				Size={new UDim2(0.934, 0, 0.927, 0)}
			>
				<uistroke Thickness={4} Transparency={0.63} />
			</frame>
			<viewportframe
				ref={vpf}
				BackgroundTransparency={1}
				Position={new UDim2(0, 0, 0.1, 0)}
				Size={new UDim2(1, 0, 0.9, 0)}
				LightColor={new Color3(0, 0, 0)}
				LightDirection={new Vector3(0, 0, 0)}
			/>
		</imagebutton>
	);
}
