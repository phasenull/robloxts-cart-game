import React, { useEffect, useState } from "@rbxts/react";
import Signal from "@rbxts/signal";
import { CashVFX } from "./cash-vfx";
import { UIHelper } from "client/ui.helper";
import { A } from "shared/assets";

interface CashPopup {
	position: Vector3;
	id: number;
}
export function CashHUD() {
	const [popups, setPopups] = useState<CashPopup[]>([]);
	useEffect(() => {
		const conn = CashPopupSignal.Connect((position) => {
			UIHelper.playSound(A.sounds.ace.cash)
			setPopups((prev) => [...prev, { position, id: math.random() }]);
		});
		return () => {
			conn.Disconnect();
		};
	}, []);
    
    return (<>
        {popups.map((popup) => (
            <CashVFX key={popup.id} spawnPosition={popup.position} seed={popup.id} />
        ))}
    </>);
}

export const CashPopupSignal = new Signal<(position: Vector3) => void>();
