import React from "@rbxts/react";
import { GoofyText } from "client/ui/components/goofy-text";
import { ICart } from "shared/type.helper";
import { ShopBillboardGui } from "./shop-billboard-gui";

export function ShopWorldviewGuis(props: { cart: ICart | undefined }) {
	const cart = props.cart;
	const wheels = cart?.Wheels;
	const FR_WHEEL = wheels?.FindFirstChild("FR");
	const positions = {
		speed: FR_WHEEL?.FindFirstChild("WHEEL") as BasePart,
	};
	return (
		props.cart ? <>
			<ShopBillboardGui progress={.3} text="Power: 40" target_instance={positions.speed}></ShopBillboardGui>
		</> : undefined
	);
}
