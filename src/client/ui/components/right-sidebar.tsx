import React from "@rbxts/react"
import { UIDIM } from "../constants"
import { RottenButton } from "./buttons/rotten-button"
import { useNavigator } from "../hooks/useNavigator"
import { useCart } from "../contexts/cart.context"
import { MarketplaceService, Players } from "@rbxts/services"
import { getConfig } from "shared/config.helper"
import { PRODUCTS } from "shared/purchasables"
import { useCheckpoint } from "../gui/cart/hooks/useCheckpoint"
import { getCheckpointDataFromIndex } from "shared/cart.helper"

export function RightSidebar() {
	const navigator = useNavigator()
	const cart = useCart().cart
	const { currentCheckpoint } = useCheckpoint()
	const data = getCheckpointDataFromIndex(currentCheckpoint + 1) ||  getCheckpointDataFromIndex(currentCheckpoint + 2)
	return (
		<frame
			key={"right-sidebar"}
			Size={UDim2.fromScale(0.3, 0.3)}
			Position={UIDIM.RIGHT}
			AnchorPoint={UIDIM.A_RIGHT}
			BackgroundTransparency={1}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				SortOrder={Enum.SortOrder.LayoutOrder}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				Padding={new UDim(.1,0)}
			/>
			<uipadding PaddingRight={new UDim(0.1, 0)} />
			<uiaspectratioconstraint AspectRatio={0.5} />
			{cart ? undefined : (
				<RottenButton
					Color={new Color3(0, 0.35, 1)}
					Size={UIDIM.ONE}
					Text="Teleport"
					onClick={() => navigator.setOpenGui("teleport")}
				/>
			)}
			{data ? (
				<RottenButton
					Color={new Color3(1, 0.9, 0)}
					Size={UIDIM.ONE}
					Text="Skip Stage"
					onClick={() =>
						MarketplaceService.PromptProductPurchase(
							Players.LocalPlayer,
							PRODUCTS.skip_island
						)
					}
				/>
			) : undefined}
		</frame>
	)
}
