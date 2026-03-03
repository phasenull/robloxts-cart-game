import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps } from "@rbxts/ui-labs"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import { ErrorProvider } from "@common/client/ui/contexts/error.context"
import { GuiProvider } from "@common/client/ui/contexts/gui-manager.context"
import { RottenShopGui } from "client/ui/gui/rotten-shop/rotten-shop-gui";

const query_client = new QueryClient()

const controls = {}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<ErrorProvider>
				<QueryClientProvider value={query_client}>
					<GuiProvider>
						<RottenShopGui />
					</GuiProvider>
				</QueryClientProvider>
			</ErrorProvider>
		)
	}
}

export = story
