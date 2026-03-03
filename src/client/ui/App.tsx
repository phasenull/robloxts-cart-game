import React, { useState } from "@rbxts/react";
import { A } from "@common/shared/assets";
import { ErrorPopup } from "@common/client/ui/components/error-popup";
import { GUI_KEYS, PRIMARY, UIDIM } from "@common/client/ui/constants";
import {
	ErrorProvider,
	useErrorPage,
} from "@common/client/ui/contexts/error.context";
import { GuiProvider } from "@common/client/ui/contexts/gui-manager.context";
import { SettingsProvider } from "@common/client/ui/contexts/settings.context";
import { CartProvider } from "./contexts/cart.context";
import { NotificationProvider } from "./contexts/notification.context";
import { NotificationListener } from "./components/notification-listener";
import BlurGui from "@common/client/ui/gui/blur-gui";
import { QueryClient, QueryClientProvider } from "@rbxts/react-query";
import { CartHud } from "./gui/cart/cart-hud";
import { DeathGui } from "./gui/cart/death-gui";
import { CheckpointProvider } from "./gui/cart/hooks/useCheckpoint";
import { RightSidebar } from "./components/right-sidebar";

import Sidebar from "./gui/sidebar";
import { CartCustomizationGui } from "./gui/cart/shop-gui";
import { GlobalHUDGui } from "./gui/global-hud-gui";
import { NotificationsGui } from "./gui/notifications/notifications-gui";
import { CartGui } from "./gui/cart-gui";
import { RottenShopGui } from "./gui/rotten-shop/rotten-shop-gui";
import { TPGui } from "./gui/tp-gui";
import { SettingsGui } from "./gui/settings-gui";
import { FeedbackGui } from "./gui/feedback-gui";
import { BigCheckpointCartPopup } from "./components/BigCheckpointCartPopup";
import { FadeGui } from "@common/client/ui/gui/fade-gui";
import { CashHUD } from "./components/cash-hud";
import { ProductPurchasing } from "./gui/suspense/product-purchasing";
import { __IS_EDIT__ } from "@common/shared/config.builder";
import PopGui from "@common/client/ui/components/pop-gui";
const query_client = new QueryClient({
	defaultOptions: {
		queries: {
			onSettled: (_, __, key) => {
				print(`Query ${tostring(key)} has been settled`);
			},
		},
		mutations: {
			onSettled: (_, __, key) => {
				print(`Mutation ${tostring(key)} has been settled`);
			},
		},
	},
});
export function App(props: { initial_gui?: GUI_KEYS; cart_enabled?: boolean }) {
	return (
		<ErrorProvider>
			<QueryClientProvider value={query_client}>
				<CartProvider>
					<CheckpointProvider>
						<NotificationProvider>
							<NotificationListener>
								<GuiProvider
									initial_gui={__IS_EDIT__ ? props.initial_gui : undefined}
								>
									<SettingsProvider>
										<BigCheckpointCartPopup />
										<GlobalHUDGui />
										<FadeGui />
										<ProductPurchasing />
										<CashHUD />
										<DeathGui />
										<RightSidebar />
										<CartHud />
										<ErrorPopup />
										<BlurGui />
										<PopGui id={"settings"}>
											<SettingsGui />
										</PopGui>
										<PopGui hide_title disable_default_close id={"teleport"}>
											<TPGui />
										</PopGui>
										<PopGui id={"items"} />
										<PopGui id={"gift"}>
											<imagelabel
												Size={UIDIM.ONE}
												AnchorPoint={UIDIM.A_CENTER}
												Position={UIDIM.CENTER}
												ScaleType={Enum.ScaleType.Crop}
												Image={A.ui.waves4}
												BackgroundColor3={PRIMARY}
												ImageTransparency={0.6}
											>
												<uicorner CornerRadius={new UDim(0.1, 0)} />
											</imagelabel>
										</PopGui>
										<PopGui id={"leaderboard"}>
											{/* <LeaderboardGui/> */}
										</PopGui>
										<PopGui id={"feedback"} Size={new UDim2(0.55, 0, 0.75, 0)}>
											<FeedbackGui />
										</PopGui>
										{/* <PopGui Size={new UDim2(1.2, 0, 0.8, 0)} id={"shop"}>
											<PassShopGui />
										</PopGui> */}
										<PopGui
											Size={UDim2.fromScale(1, 1)}
											disable_default_close
											hide_title
											id={"rotten-shop"}
										>
											<RottenShopGui />
										</PopGui>
										<PopGui id={"cart"}>
											<CartGui />
										</PopGui>

										<PopGui
											Size={UDim2.fromScale(1, 1)}
											id="carts"
											hide_title={true}
											disable_default_close={true}
											disable_aspect_ratio={true}
										>
											<CartCustomizationGui />
										</PopGui>
										<NotificationsGui />
									</SettingsProvider>
								</GuiProvider>
							</NotificationListener>
						</NotificationProvider>
					</CheckpointProvider>
				</CartProvider>
			</QueryClientProvider>
		</ErrorProvider>
	);
}
