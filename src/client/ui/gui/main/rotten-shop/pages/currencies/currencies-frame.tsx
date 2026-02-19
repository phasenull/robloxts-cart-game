import React from "@rbxts/react"

interface CurrenciesFrameProps {
	children?: React.ReactNode
	layoutOrder?: number
}

export function CurrenciesFrame({ children, layoutOrder = 9 }: CurrenciesFrameProps) {
	return (
		<frame
			key="CurrenciesPage"
			BackgroundTransparency={1}
			LayoutOrder={layoutOrder}
			Position={new UDim2(0.028, 0, 0.181, 0)}
			Size={new UDim2(0.9450000000000001, 0, 0.27, 0)}
		>
			<uigridlayout
				CellPadding={new UDim2(0.02, 0, 0.06, 0)}
				CellSize={new UDim2(0.32, 0, 0.45, 0)}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>
			{children}
		</frame>
	)
}