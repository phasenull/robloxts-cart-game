import React, { useState } from "@rbxts/react"
import { A } from "shared/assets"
import { ErrorPopup } from "./components/error-popup"
import PopGui from "./components/pop-gui"
import { GUI_KEYS, PRIMARY, UIDIM } from "./constants"
import { ErrorProvider, useErrorPage } from "./contexts/error.context"
import { GuiProvider } from "./contexts/gui-manager.context"
import { SettingsProvider } from "./contexts/settings.context"
import { CartProvider } from "./contexts/cart.context"
import { NotificationProvider } from "./contexts/notification.context"
import { NotificationListener } from "./components/notification-listener"
import BlurGui from "./gui/blur-gui"
import { SettingsGui } from "./gui/main/settings-gui"
import { PassShopGui } from "./gui/main/pass-shop-gui"
import { RottenShopGui } from "./gui/main/rotten-shop/rotten-shop-gui"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import { CartGui } from "./gui/main/cart-gui"
import { CartHud } from "./gui/cart/cart-hud"
import { DeathGui } from "./gui/cart/death-gui"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { FadeGui } from "./gui/main/fade-gui"
import { CheckpointProvider } from "./gui/cart/hooks/useCheckpoint"
import { RightSidebar } from "./components/right-sidebar"
import { TPGui } from "./gui/main/tp-gui"
import Sidebar from "./gui/sidebar"
import { NotificationsGui } from "./gui/main/notifications/notifications-gui"
import { ShopGui } from "./gui/cart/shop-gui"
import { GlobalHUDGui } from "./gui/global-hud-gui"
import { LeaderboardGui } from "./gui/main/leaderboard/leaderboard-gui"
const query_client = new QueryClient({
	mutations: {
		onError: (err) => {}
	},
	queries: {
		retry: false,
		onError: (err) => {}
	}
})
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
										<Sidebar />
										<GlobalHUDGui />
										<FadeGui />
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
										<PopGui Size={new UDim2(1.2, 0, 0.8, 0)} id={"shop"}>
											<PassShopGui />
										</PopGui>
										<PopGui Size={UDim2.fromScale(1,1)} disable_default_close hide_title id={"rotten-shop"}>
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
											<ShopGui />
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
	)
}
