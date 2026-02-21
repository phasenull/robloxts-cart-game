import React from "@rbxts/react";
import { useMutation } from "@rbxts/react-query";
import { IShopItem } from "shared/type.helper";
import { ClientFunctions } from "shared/network.helper";
import { __IS_EDIT__ } from "shared/config.helper";
import { A, assets } from "shared/assets";
import { UIHelper } from "client/ui.helper";
import { useProductPrice } from "client/ui/hooks/useProductPrice";
import { PRODUCTS } from "shared/purchasables";

interface ShopHonkEntryProps {
	item: IShopItem;
	isEquipped: boolean;
	isOwned: boolean;
	onEquipSuccess: () => void;
}

function ShopHonkEntry({
	item,
	isEquipped,
	isOwned,
	onEquipSuccess,
}: ShopHonkEntryProps) {
	// All honks share a single product — show its price
	const { priceInRobux, isLoading: isPriceLoading } = useProductPrice({
		productId: PRODUCTS.honk,
		enabled: !isOwned,
	});

	const { mutate, isLoading } = useMutation({
		queryKey: ["honk-action", item.name],
		mutationFn: async () => {
			if (__IS_EDIT__) return;

			if (isOwned && !isEquipped) {
				// Equip
				const [success, err] =
					await ClientFunctions.CustomizationService.setPreference.invoke(
						"honk",
						item.name,
					);
				if (!success || err) return;
				UIHelper.playSound(A.sounds.pop_success);
				onEquipSuccess();
			} else if (!isOwned) {
				// Tell server to record intent and prompt the single honk product
				await ClientFunctions.ShopService.promptHonkPurchase.invoke(item.name);
				// Server fires the prompt; client waits for the result signal
				onEquipSuccess();
			}
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

	const canAct = !isLoading && !isEquipped && (isOwned || !!item.product_id);

	return (
		<imagebutton
			key={item.name}
			Active={canAct}
			BackgroundColor3={bgColor}
			BackgroundTransparency={isOwned || isEquipped ? 0.2 : 0.35}
			BorderSizePixel={0}
			Event={{
				MouseButton1Click: () => {
					if (canAct) mutate();
				},
				MouseEnter: () => {
					const sound = assets.honks.FindFirstChild(item.name) as Sound | undefined;
					if (sound) UIHelper.playSound(sound.SoundId);
				},
			}}
		>
			<uiaspectratioconstraint AspectRatio={1} />
			<uistroke Thickness={3} Transparency={0.2} />
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
				<uistroke Thickness={2} />
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
				<uistroke Thickness={2} />
			</textlabel>
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
	return (
		<frame
			key="HonkGrid"
			AnchorPoint={new Vector2(1, 1)}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			Position={new UDim2(0.99, 0, 0.88, 0)}
			Size={new UDim2(0.19, 0, 0.56, 0)}
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
				key="TopBar"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0, 0, 0, 0)}
				Size={new UDim2(1, 0, 0.1, 0)}
			>
				<uistroke Thickness={5} />
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
					<uistroke Thickness={3} />
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
				ScrollBarImageColor3={Color3.fromRGB(0, 0, 0)}
				ScrollBarThickness={4}
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
					PaddingTop={new UDim(0.02, 0)}
					PaddingBottom={new UDim(0.02, 0)}
					PaddingLeft={new UDim(0.02, 0)}
					PaddingRight={new UDim(0.02, 0)}
				/>
				{honkItems.map((item) => (
					<ShopHonkEntry
						key={item.name}
						item={item}
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
