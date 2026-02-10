import React from "@rbxts/react"
import { UIDIM } from "../constants"
import { RottenButton } from "./buttons/rotten-button"
import { useNavigator } from "../hooks/useNavigator"

export function RightSidebar() {
	const navigator = useNavigator()
	return (
		<frame
			key={"right-sidebar"}
			Size={UDim2.fromScale(0.3, 0.3)}
			Position={UIDIM.RIGHT}
			AnchorPoint={UIDIM.A_RIGHT}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				SortOrder={Enum.SortOrder.LayoutOrder}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
			/>
			<uipadding PaddingRight={new UDim(0.1,0)} />
			<uiaspectratioconstraint AspectRatio={0.5} />
			<RottenButton Color={new Color3(0,0.35,1)} Size={UIDIM.ONE} Text="Teleport" onClick={()=>navigator.setOpenGui("teleport")} />
		</frame>
	)
}
