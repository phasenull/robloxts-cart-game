import React, { useState } from "@rbxts/react"
import { A } from "shared/assets"
import { ErrorPopup } from "./components/error-popup"
import PopGui from "./components/pop-gui"
import { GUI_KEYS, PRIMARY, UIDIM } from "./constants"
import { ErrorProvider, useErrorPage } from "./contexts/error.context"
import { GuiContext } from "./contexts/gui-manager.context"
import { SettingsProvider } from "./contexts/settings.context"
import { CartProvider } from "./contexts/cart.context"
import BlurGui from "./gui/blur-gui"
import { SettingsGui } from "./gui/main/settings-gui"
import { ShopGui } from "./gui/main/shop-gui"
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
export function App(props: { initial_gui?: GUI_KEYS; cart_enabled?: boolean }) {
	const [open_gui, set_open_gui] = useState<GUI_KEYS | undefined>(
		__IS_EDIT__ ? props.initial_gui : undefined
	)
	const { showError } = useErrorPage()
	const query_client = new QueryClient({
		mutations: {
			onError: (err) => {
				showError({
					message: `${err}`,
					title: "An unexpected error occurred.",
					onClose: () => {}
				})
			}
		},
		queries: {
			retry: false,
			onError: (err) => {
				showError({
					message: `${err}`,
					title: "An unexpected error occurred.",
					onClose: () => {}
				})
			}
		}
	})
	const [is_sidebar_open, set_is_sidebar_open] = useState<boolean>(true)
	return (
		<ErrorProvider>
			<QueryClientProvider value={query_client}>
				<CartProvider>
					<CheckpointProvider>
						<GuiContext.Provider
							value={{
								is_sidebar_open,
								setIsSidebarOpen: set_is_sidebar_open,
								open_gui,
								setOpenGui: set_open_gui
							}}
						>
							<SettingsProvider>
								<Sidebar/>
								<FadeGui />
								<DeathGui />
								<RightSidebar />
								<CartHud />
								<ErrorPopup />
								<BlurGui />
								<PopGui id={"settings"}>
									<SettingsGui />
								</PopGui>

								<PopGui
									hide_title
									disable_default_close
									id={"teleport"}
								>
									<TPGui/>
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
								<PopGui Size={new UDim2(1.2, 0, 0.8, 0)} id={"shop"}>
									<ShopGui />
								</PopGui>
								<PopGui id={"cart"}>
									<CartGui />
								</PopGui>
							</SettingsProvider>
						</GuiContext.Provider>
					</CheckpointProvider>
				</CartProvider>
			</QueryClientProvider>
		</ErrorProvider>
	)
}
