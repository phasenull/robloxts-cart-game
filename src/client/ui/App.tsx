import React, { useState } from "@rbxts/react";
import { A } from "shared/common/assets";
import { ErrorPopup } from "client/common/ui/components/error-popup";
import { GUI_KEYS, PRIMARY, UIDIM } from "client/common/ui/constants";
import {
	ErrorProvider,
	useErrorPage,
} from "client/common/ui/contexts/error.context";
import { GuiProvider } from "client/common/ui/contexts/gui-manager.context";
import { SettingsProvider } from "client/common/ui/contexts/settings.context";
import { CartProvider } from "./contexts/cart.context";
import { NotificationProvider } from "./contexts/notification.context";
import { NotificationListener } from "./components/notification-listener";
import BlurGui from "client/common/ui/gui/blur-gui";
import { QueryClient, QueryClientProvider } from "@rbxts/react-query";
import { CartHud } from "./gui/cart/cart-hud";
import { DeathGui } from "./gui/cart/death-gui";
import { CheckpointProvider } from "./gui/cart/hooks/useCheckpoint";
import { RightSidebar } from "./components/right-sidebar";

import Sidebar from "./gui/sidebar";
import { CartCustomizationGui } from "./gui/cart/shop-gui";
import { GlobalHUDGui } from "./gui/global-hud-gui";
import { NotificationsGui } from "./gui/notifications/notifications-gui";
import { RottenShopGui } from "./gui/rotten-shop/rotten-shop-gui";
import { TPGui } from "./gui/tp-gui";
import { SettingsGui } from "./gui/settings-gui";
import { FeedbackGui } from "./gui/feedback-gui";
import { BigCheckpointCartPopup } from "./components/BigCheckpointCartPopup";
import { FadeGui } from "client/common/ui/gui/fade-gui";
import { CashHUD } from "./components/cash-hud";
import { ProductPurchasing } from "./gui/suspense/product-purchasing";
import { __IS_EDIT__ } from "shared/common/config.builder";
import PopGui from "client/common/ui/components/pop-gui";
import { CashLabelProvider } from "client/common/ui/contexts/cash-label.context";
import { AppTasksProvider } from "client/common/ui/contexts/app-tasks.context";
export function App(props: { initial_gui?: GUI_KEYS; cart_enabled?: boolean }) {
	// one query cache per mounted App (per generation), not module-level state
	const [query_client] = useState(() => new QueryClient());
	return (
		<AppTasksProvider>
		<CashLabelProvider>
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
		</CashLabelProvider>
		</AppTasksProvider>
	);
}
