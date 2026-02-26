import React, { useEffect, useState } from "@rbxts/react";
import { MarketplaceService, Players } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { LoadingIndicator } from "client/ui/components/loading-indicator";
import { UIDIM } from "client/ui/constants";
import useAnimateValue from "client/ui/hooks/useAnimateValue";
import { FlashingContainer } from "./flashing-container";

export function ProductPurchasing() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const conn = MarketplaceService.PromptProductPurchaseFinished.Connect(
			(player, productId, wasPurchased) => {
				if (player !== Players.LocalPlayer.UserId) {
					return;
				}
				setVisible(false);
			},
		);
		const promptConn = PromptPurchaseSignal.Connect((state) => {
			setVisible(state);
		});
		return () => {
			conn.Disconnect();
			promptConn.Disconnect();
		};
	}, []);
	const value = useAnimateValue({
		target_value: visible ? 1 : 0,
		tween_info: new TweenInfo(
			0.5,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out,
		),
	});
	if (value === 0) return;
	return (
		<frame
			Size={UIDIM.ONE}
			BackgroundTransparency={1 - value * 0.5}
			BorderSizePixel={0}
			BackgroundColor3={new Color3(0, 0, 0)}
			ZIndex={50}
		>
            {value === 1 ? <FlashingContainer /> : undefined}
			<LoadingIndicator
				Position={UDim2.fromScale(0.5, 0.9)}
                AnchorPoint={UIDIM.A_BOTTOM}
				Size={UDim2.fromScale(0.2, 0.2 * value)}
			/>
		</frame>
	);
}
export const PromptPurchaseSignal = new Signal<(state: boolean) => void>();
