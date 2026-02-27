import React from "@rbxts/react";
import { UIDIM } from "@common/client/ui/constants";
import { RottenButton } from "@common/client/ui/components/buttons/rotten-button";
import { useNavigator } from "@common/client/ui/hooks/useNavigator";
import { useCart } from "../contexts/cart.context";
import { useCheckpoint } from "../gui/cart/hooks/useCheckpoint";
import useAnimateValue from "@common/client/ui/hooks/useAnimateValue";
import { UIHelper } from "@common/client/ui.helper";
import { CashLabel } from "../gui/global-hud-gui";
import { useSettings } from "@common/client/ui/contexts/settings.context";
import { A } from "@common/shared/assets";
import { Icon } from "@common/client/ui/components/icon";
import { __IS_EDIT__ } from "@common/shared/config.builder";
import { TextChatService } from "@rbxts/services";

export function RightSidebar() {
	const navigator = useNavigator();
	const cart = useCart().cart;
	const { currentCheckpoint } = useCheckpoint();
	const { musicMuted, setMusicMuted } = useSettings();

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
			Position={UIDIM.LEFT.add(UDim2.fromScale(0, -.1))
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
				Padding={new UDim(0.05, 0)}
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
			<RottenButton
				key={"mute-button"}
				Color={musicMuted ? new Color3(0.77, 0, 0) : new Color3(0, 0.6, 0.2)}
				Size={UDim2.fromScale(0.4, 1)}
				Ratio={1}
				Text={"Music"}
				onClick={() => { if (!__IS_EDIT__) setMusicMuted(!musicMuted); }}
			>
				<Icon
					Image={musicMuted ? A.icons.sound_muted : A.icons.sound}
					Size={new UDim2(0.35, 0, 0.35, 0)}
					Position={new UDim2(0.95, 0, 0.05, 0)}
					AnchorPoint={new Vector2(1, 0)}
					Color3={new Color3(1, 1, 1)}
					Transparency={0.2}
					ZIndex={5}
				/>
			</RottenButton>
		</frame>
	);
}
