import React from "@rbxts/react"
import { PurchasableContainer } from "client/ui/components/purchasable-container"
import { UIDIM } from "client/ui/constants"
import { purchasables } from "shared/purchasables"

export function Gamepasses() {
	return (
		<scrollingframe
			Size={new UDim2(1, 0, 1, 0)}
			Position={new UDim2(0.5, 0, 1, 0)}
			AnchorPoint={UIDIM.A_BOTTOM}
			BackgroundTransparency={1}
			BorderSizePixel={0}
			CanvasSize={UIDIM.ZERO}
			ScrollingDirection={Enum.ScrollingDirection.Y}
			AutomaticCanvasSize={Enum.AutomaticSize.Y}
			ClipsDescendants={true}
		>
			<uipadding PaddingTop={new UDim(0, 20)} PaddingBottom={new UDim(0, 50)} />
			<uigridlayout
				CellSize={new UDim2(0.495, 0, 1, 0)}
				CellPadding={new UDim2(0.01, 0, 0.04, 0)}
			>
				<uiaspectratioconstraint AspectRatio={2} />
			</uigridlayout>
			{purchasables.gamepasses.map((item) => (
				<PurchasableContainer purchasable_type="gamepass" purchasable_id={item} />
			))}
		</scrollingframe>
	)
}
