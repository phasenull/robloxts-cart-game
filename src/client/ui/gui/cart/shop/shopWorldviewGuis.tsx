import React from "@rbxts/react"
import { GoofyText } from "client/ui/components/goofy-text"
import { ICart } from "shared/type.helper"
import { ShopBillboardGui } from "./shop-billboard-gui"
import { getCartConfig } from "shared/cart.helper"

export function ShopWorldviewGuis(props: { cart: ICart | undefined }) {
	const cart = props.cart
	const wheels = cart?.Wheels
	const FR_WHEEL = wheels?.FindFirstChild("FR")
	const positions = {
		speed: FR_WHEEL?.FindFirstChild("BALL") as BasePart,
		brake: cart?.FindFirstChild("HandBrake")?.FindFirstChild("G2") as BasePart,
		honk: cart?.FindFirstChild("Honk")?.FindFirstChild("HonkBase") as BasePart
	}
	const cart_identifier = (cart?.FindFirstChild("CartIdentifier") as StringValue | undefined)?.Value
	const config = getCartConfig(cart_identifier ?? "")
	return props.cart ? (
		<>
			<ShopBillboardGui
				progress={0.3}
				text={`Speed: ${config?.power}`}
				target_instance={positions.speed}
			/>
			<ShopBillboardGui
				x_distance={15}
				progress={0.3}
				text={`Brake: ${config?.friction}`}
				target_instance={positions.brake}
			/>
			<ShopBillboardGui
				x_distance={30}
				progress={1}
				offset={new Vector3(.4, 0, 0)}
				text="Pizza Scream"
				mirrored
				target_instance={positions.honk}
			/>
		</>
	) : undefined
}
