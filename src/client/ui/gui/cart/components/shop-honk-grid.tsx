import React, { useRef, useState } from "@rbxts/react";
import { useMutation } from "@rbxts/react-query";
import { MarketplaceService } from "@rbxts/services";
import { IShopItem } from "shared/type.helper";
import { network } from "shared/net"
import { __IS_EDIT__ } from "shared/common/config.builder";
import { A, assets } from "shared/common/assets";
import { UIHelper } from "client/common/ui.helper";
import { useProductPrice } from "client/common/ui/hooks/useProductPrice";
import { PRODUCTS } from "shared/purchasables";

interface ShopHonkEntryProps {
	item: IShopItem;
	isEquipped: boolean;
	LayoutOrder: number;
	isOwned: boolean;
	onEquipSuccess: () => void;
}

function ShopHonkEntry({
	item,
	isEquipped,
	isOwned,
	LayoutOrder,
	onEquipSuccess,
}: ShopHonkEntryProps) {
	// All honks share a single product — show its price
	const { priceInRobux, isPending: isPriceLoading } = useProductPrice({
		productId: PRODUCTS.honk,
		enabled: !isOwned,
	});

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (__IS_EDIT__) return true;

			if (isOwned && !isEquipped) {
				// Equip
				const [success, err] =
					await network.client.CustomizationService.setPreference.invoke(
						"honk",
						item.name,
					);
				if (!success || err) return false;
				UIHelper.playSound(A.sounds.pop_success);
				onEquipSuccess();
			} else if (!isOwned) {
				// Tell server to record intent and prompt the single honk product
				const [ok, err] = await network.client.ShopService.promptHonkPurchase.invoke(item.name);
				if (!ok || err) return true;
				// Wait for the Roblox purchase dialog to close
				const [_, __, wasPurchased] = MarketplaceService.PromptProductPurchaseFinished.Wait();
				if (wasPurchased) {
					UIHelper.playSound(A.sounds.reward_earned);
					onEquipSuccess();
				}
			}
			return true
		},
	});

	const bgColor = isEquipped
		? Color3.fromRGB(255, 215, 0)
		: isOwned
			? Color3.fromRGB(80, 180, 80)
			: Color3.fromRGB(140, 50, 200);

	const statusText = isEquipped
		? "EQUIPPED"
		: isOwned
			? "OWNED"
			: isPriceLoading
				? "..."
				: priceInRobux !== undefined
					? `\u{E002} ${priceInRobux}`
					: "\u{E002} ???";

	const canAct = !isPending && !isEquipped && (isOwned || !!item.product_id);
	const previewSoundRef = useRef<Sound | undefined>(undefined);
	const [isHovered, setIsHovered] = useState(false);

	return (
		<imagebutton
			key={item.name}
			Active={canAct}
			BackgroundColor3={bgColor}
			BackgroundTransparency={isOwned || isEquipped ? 0.2 : 0.35}
			BorderSizePixel={0}
			LayoutOrder={LayoutOrder}
			Event={{
				MouseButton1Click: () => {
					if (canAct) mutate();
				},
				MouseEnter: () => {
					setIsHovered(true);
					const sound = assets.honks.FindFirstChild(item.name) as Sound | undefined;
					if (sound) previewSoundRef.current = UIHelper.playSound(sound.SoundId);
				},
				MouseLeave: () => {
					setIsHovered(false);
					if (previewSoundRef.current) {
						previewSoundRef.current.Stop();
						previewSoundRef.current = undefined;
					}
				},
			}}
		>
			<uiaspectratioconstraint AspectRatio={1} />
			<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.03} Transparency={0.2} />
			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, Color3.fromRGB(200, 200, 200)),
						new ColorSequenceKeypoint(1, Color3.fromRGB(255, 255, 255)),
					])
				}
				Rotation={-90}
			/>
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://120250412681646"
				ImageTransparency={0.9}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 1, 0)}
				TileSize={new UDim2(0, 50, 0, 50)}
			/>
			<textlabel
				AnchorPoint={new Vector2(0.5, 0)}
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				Position={new UDim2(0.5, 0, 0.04, 0)}
				Size={new UDim2(0.9, 0, 0.45, 0)}
				Text={item.name}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextWrapped={true}
				ZIndex={5}
			>
				<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1} />
			</textlabel>
			<textlabel
				AnchorPoint={new Vector2(0.5, 1)}
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				Position={new UDim2(0.5, 0, 0.96, 0)}
				Size={new UDim2(0.9, 0, 0.35, 0)}
				Text={statusText}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextWrapped={true}
				TextXAlignment={Enum.TextXAlignment.Right}
				ZIndex={5}
			>
				<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1} />
			</textlabel>
			{isHovered && (
				<imagelabel
					key="SoundIcon"
					AnchorPoint={new Vector2(0, 1)}
					BackgroundTransparency={1}
					Image="rbxassetid://118552291926802"
					Position={new UDim2(0.1, 0, 0.9, 0)}
					Size={new UDim2(0.2, 0, 0.2, 0)}
					ZIndex={10}
				>
					<uiaspectratioconstraint AspectRatio={1} />
				</imagelabel>
			)}
		</imagebutton>
	);
}

interface ShopHonkGridProps {
	equippedHonk: string | undefined;
	ownedHonks: string[];
	honkItems: IShopItem[];
	onEquipSuccess: () => void;
}

export function ShopHonkGrid({
	equippedHonk,
	ownedHonks,
	honkItems,
	onEquipSuccess,
}: ShopHonkGridProps) {
	const sortedHonkItems = [...honkItems].sort((a, b) => {
		const aEquipped = equippedHonk === a.name;
		const bEquipped = equippedHonk === b.name;
		if (aEquipped !== bEquipped) return aEquipped;

		const aOwned = ownedHonks.includes(a.name);
		const bOwned = ownedHonks.includes(b.name);
		if (aOwned !== bOwned) return aOwned;

		return a.name < b.name;
	});

	return (
		<frame
			key="HonkGrid"
			AnchorPoint={new Vector2(1, 1)}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			Position={new UDim2(0.99, 0, 0.88, 0)}
			Size={new UDim2(0.19, 0, 0.56, 0)}
		>
			<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.01} />
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
				key="TopBar"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0, 0, 0, 0)}
				Size={new UDim2(1, 0, 0.1, 0)}
			>
				<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.01} />
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
				<frame
					key="Bottom"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.921, 0)}
					Size={new UDim2(1, 0, 0.079, 0)}
				/>
				<textlabel
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.5, 0, 0.5, 0)}
					Size={new UDim2(0.9, 0, 0.7, 0)}
					Text="Honks"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
				>
					<uistroke StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.01} />
				</textlabel>
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(0, 120, 255)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(0, 220, 255)),
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
				Position={new UDim2(0.5, 0, 0.1, 0)}
				ScrollBarImageColor3={Color3.fromRGB(255, 255, 255)}
				ScrollBarThickness={10}
				ScrollingDirection={Enum.ScrollingDirection.Y}
				Size={new UDim2(1, 0, 0.9, 0)}
			>
				<uigridlayout
					CellPadding={new UDim2(0.04, 0, 0.02, 0)}
					CellSize={new UDim2(0.46, 0, .45, 0)}
					FillDirection={Enum.FillDirection.Horizontal}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					SortOrder={Enum.SortOrder.LayoutOrder}
				>
					<uiaspectratioconstraint AspectRatio={1} />
				</uigridlayout>
				<uipadding
					PaddingRight={new UDim(0.05, 0)}
				/>
				{sortedHonkItems.map((item,i) => (
					<ShopHonkEntry
						key={item.name}
						item={item}
						LayoutOrder={i}
						isEquipped={equippedHonk === item.name}
						isOwned={ownedHonks.includes(item.name)}
						onEquipSuccess={onEquipSuccess}
					/>
				))}
			</scrollingframe>
			<uigradient
				Rotation={90}
				Transparency={
					new NumberSequence([
						new NumberSequenceKeypoint(0, 0.6, 0),
						new NumberSequenceKeypoint(1, 0.256, 0),
					])
				}
			/>
		</frame>
	);
}
