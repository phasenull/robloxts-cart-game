import React from "@rbxts/react";
import { UIDIM } from "../constants";
import { RottenButton } from "./buttons/rotten-button";
import { useNavigator } from "../hooks/useNavigator";
import { useCart } from "../contexts/cart.context";
import { MarketplaceService, Players } from "@rbxts/services";
import { getConfig } from "shared/config.helper";
import { PRODUCTS } from "shared/purchasables";
import { useCheckpoint } from "../gui/cart/hooks/useCheckpoint";
import { getCheckpointDataFromIndex } from "shared/cart.helper";
import useAnimateValue from "../hooks/useAnimateValue";
import { UIHelper } from "client/ui.helper";
import { CashLabel } from "../gui/global-hud-gui";

export function RightSidebar() {
	const navigator = useNavigator();
	const cart = useCart().cart;
	const { currentCheckpoint } = useCheckpoint();

	const animatedValue = useAnimateValue({
		target_value: navigator.isSidebarOpen ? 0 : 1,
		tween_info: new TweenInfo(
			0.4,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out,
		),
	});

	return (
		<frame
			key={"right-sidebar"}
			Size={UDim2.fromScale(0.6, 0.34)}
			Position={UIDIM.LEFT.sub(UDim2.fromScale(0, 0.05))
				.add(UDim2.fromOffset(10, 0))
				.add(UDim2.fromScale(-0.4 * animatedValue, 0))}
			AnchorPoint={UIDIM.A_LEFT}
			BackgroundTransparency={1}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				SortOrder={Enum.SortOrder.LayoutOrder}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				HorizontalAlignment={Enum.HorizontalAlignment.Left}
				Padding={new UDim(0.1, 0)}
			/>
			<uipadding PaddingRight={new UDim(0.1, 0)} />
			<uiaspectratioconstraint AspectRatio={0.5} />
			<CashLabel />

			<RottenButton
				Color={new Color3(0, 0.35, 1)}
				Size={UIDIM.ONE}
				Text="Teleport"
				onClick={() => navigator.setOpenGui("teleport")}
			/>
			<RottenButton
				Color={new Color3(1, 0.28, 0)}
				Size={UIDIM.ONE}
				Text="Carts"
				onClick={() => {
					task.spawn(() => {
						UIHelper.toggleFade(true);
						task.wait(0.4);
						navigator.setOpenGui("carts");
					});
				}}
			/>
			<RottenButton
				Color={new Color3(1, 0.85, 0)}
				Size={UIDIM.ONE}
				Text="Store"
				onClick={() => {
					navigator.setOpenGui("rotten-shop");
				}}
			/>
			{/* <RottenButton
				Color={new Color3(0, 0.85, 1)}
				Size={UIDIM.ONE}
				Text="Leaderboard"
				onClick={() => {
					navigator.setOpenGui("leaderboard")
				}}
			/> */}
		</frame>
	);
}
