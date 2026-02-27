import React, { useEffect, useState } from "@rbxts/react";
import { CashVFX } from "@common/client/ui/components/cash-vfx";
import { calculatePitch, UIHelper } from "@common/client/ui.helper";
import { A } from "@common/shared/assets";
import { CashPopupSignal } from "@common/shared/cash-popup.signal";
import { useCart } from "../contexts/cart.context";

interface CashPopup {
	position: Vector3;
	id: number;
}
export function CashHUD() {
	const [popups, setPopups] = useState<CashPopup[]>([]);
	const cart = useCart().cart
	useEffect(() => {
		const conn = CashPopupSignal.Connect((position) => {
			const override_pos = cart?.instance?.GetPivot().Position
			if (!override_pos) return
			const sound = UIHelper.playSound(A.sounds.ace.cash);
			const pitch = calculatePitch(A.sounds.ace.cash);
			sound.Pitch = pitch;
			setPopups((prev) => [...prev, { position:override_pos, id: math.random() }]);
		});
		return () => {
			conn.Disconnect();
		};
	}, [cart]);

	return (
		<>
			{popups.map((popup) => (
				<CashVFX
					key={popup.id}
					seed={popup.id}
				/>
			))}
		</>
	);
}
