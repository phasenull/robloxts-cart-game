import React from "@rbxts/react"

interface BrProps {
	H: number
}

export function Br({ H }: BrProps) {
	return <frame Size={new UDim2(1, 0, H, 0)} BackgroundTransparency={1} />
}