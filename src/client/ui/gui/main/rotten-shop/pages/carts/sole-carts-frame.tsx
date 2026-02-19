import React from "@rbxts/react"

interface SoleCartsFrameProps {
	children?: React.ReactNode
	layoutOrder?: number
}

export function SoleCartsFrame({ children, layoutOrder = 4 }: SoleCartsFrameProps) {
	return (
		<frame
			key="SoleCartsPage"
			BackgroundTransparency={1}
			LayoutOrder={layoutOrder}
			Position={new UDim2(0.028, 0, -0.35100000000000003, 0)}
			Size={new UDim2(0.9450000000000001, 0, 0.25, 0)}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				Padding={new UDim(0.02, 0)}
				SortOrder={Enum.SortOrder.LayoutOrder}
				VerticalAlignment={Enum.VerticalAlignment.Center}
			/>
			{children}
		</frame>
	)
}