import React from "@rbxts/react"
import { GoofyText } from "client/ui/components/goofy-text"
import { ICart } from "shared/type.helper"
import { ShopBillboardGui } from "./shop-billboard-gui"

export function ShopWorldviewGuis(props: { cart: ICart | undefined }) {
	const cart = props.cart
	const wheels = cart?.Wheels
	const FR_WHEEL = wheels?.FindFirstChild("FR")
	const positions = {
		speed: FR_WHEEL?.FindFirstChild("WHEEL") as BasePart,
		brake: cart?.FindFirstChild("HandBrake")?.FindFirstChild("G2") as BasePart,
		honk: cart?.FindFirstChild("Honk")?.FindFirstChild("HonkBase") as BasePart
	}
	return props.cart ? (
		<>
			<ShopBillboardGui
				progress={0.3}
				text="Speed: 40"
				target_instance={positions.speed}
			/>
			<ShopBillboardGui
				x_distance={15}
				progress={0.3}
				text="Brake: 40"
				target_instance={positions.brake}
			/>
			<ShopBillboardGui
				x_distance={15}
				progress={0.3}
				text="Pizza Scream"
				target_instance={positions.honk}
			/>
		</>
	) : undefined
}
