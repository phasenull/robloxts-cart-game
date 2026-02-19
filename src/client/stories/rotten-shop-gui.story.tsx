import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps } from "@rbxts/ui-labs"
import { RottenShopGui } from "client/ui/gui/main/rotten-shop/rotten-shop-gui"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import { ErrorProvider } from "client/ui/contexts/error.context"
import { GuiProvider } from "client/ui/contexts/gui-manager.context"

const query_client = new QueryClient({
	mutations: {
		onError: (err) => {}
	},
	queries: {
		retry: false,
		onError: (err) => {}
	}
})

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
