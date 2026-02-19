import React from "@rbxts/react"

interface CurrenciesFrameProps {
	children?: React.ReactNode
	layoutOrder?: number
}

export function CurrenciesFrame({ children}: CurrenciesFrameProps) {
	return (
		<frame
			key="CurrenciesPage"
			BackgroundTransparency={1}
			Position={new UDim2(0.028, 0, 0.181, 0)}
			Size={new UDim2(0.94, 0, 0.5, 0)}
		>
			<uigridlayout
				CellPadding={new UDim2(0.03, 0, 0.07, 0)}
				CellSize={new UDim2(1, 0, .56, 0)}
				SortOrder={Enum.SortOrder.LayoutOrder}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
			>
				<uiaspectratioconstraint AspectRatio={1.5} />
			</uigridlayout>
			{children}
		</frame>
	)
}