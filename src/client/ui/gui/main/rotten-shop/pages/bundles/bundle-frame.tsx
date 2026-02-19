import React, { ReactNode } from "@rbxts/react"

export function BundleFrame(props: { children?: ReactNode }) {
	return (
		<frame
			key="Bundles"
			BackgroundTransparency={1}
			Size={new UDim2(0.95, 0, 0.793, 0)}
		>
			<uiaspectratioconstraint AspectRatio={1.8} />
			{props.children}
		</frame>
	)
}
