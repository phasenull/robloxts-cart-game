import React from "@rbxts/react"
import { PRIMARY, UIDIM } from "../constants"
import { A } from "shared/assets"

export function EmptyContainer(props: {
	children?: React.ReactNode
	Size?: UDim2
	Position?: UDim2
	AnchorPoint?: Vector2
	Color?: Color3
	Corner?: UDim
	ClipsDescendants?: boolean
}) {
	return (
		<imagelabel
			Size={props.Size ?? UIDIM.ONE}
			AnchorPoint={props.AnchorPoint ?? UIDIM.A_CENTER}
			Position={props.Position ?? UIDIM.CENTER}
			ScaleType={Enum.ScaleType.Crop}
			Image={A.ui.waves4}
			ClipsDescendants={props.ClipsDescendants ?? false}
			BackgroundColor3={props.Color ?? PRIMARY}
			ImageTransparency={0.6}
		>
			<uicorner CornerRadius={ props.Corner ?? new UDim(0.1, 0)} />
			{props.children}
		</imagelabel>
	)
}
