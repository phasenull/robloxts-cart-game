import React, { useEffect, useState } from "@rbxts/react"
import { useCart } from "client/ui/contexts/cart.context"
import { useCheckpoint } from "./hooks/useCheckpoint"
import { Workspace } from "@rbxts/services"
import { ProgressBarComponent } from "client/ui/components/progressbar-component"
import { useRendering } from "client/ui/hooks/useRendering"
import { sphere } from "@rbxts/better-gizmos"
import { GoofyText } from "client/ui/components/goofy-text"
import { UIDIM } from "client/ui/constants"
import { getCheckpointDataFromIndex } from "../main/tp-gui"
function getCheckpointModelByIndex(index: number): Model | undefined {
	const checkpoints = Workspace.FindFirstChild("Checkpoints") as Folder
	return checkpoints
		.GetChildren()
		.find((child) => child.Name === tostring(index)) as Model | undefined
}
export function StageProgress() {
	const { cart } = useCart()
	const { currentCheckpoint } = useCheckpoint()
	const tick = useRendering()

	const cart_position = (cart?.instance?.FindFirstChild("Root") as BasePart)
		?.Position
	if (!cart_position) {
		return
	}
	const checkpoint = getCheckpointModelByIndex(getPreviousBigCheckpoint(currentCheckpoint))
	if (!checkpoint) {
		return
	}
	const next_checkpoint = getCheckpointModelByIndex(getNextBigCheckpoint(currentCheckpoint))
	if (!next_checkpoint) {
		return
	}
	const current_position = (
		(checkpoint.FindFirstChild("Trigger") ||
			checkpoint.FindFirstChild("Spawn")) as BasePart
	)?.Position
	const next_position = (
		(next_checkpoint.FindFirstChild("Trigger") ||
			next_checkpoint.FindFirstChild("Spawn")) as BasePart
	)?.Position
	const total_distance = next_position.sub(current_position).Magnitude
	const current_distance = math.clamp(
		cart_position.sub(next_position).Magnitude,
		0,
		total_distance
	)
	const new_progress = 1 - math.clamp(current_distance / total_distance, 0, 1)
	if (next_checkpoint === checkpoint) {
		return
	}
	if (!cart) return
	return (
		<frame BackgroundTransparency={1} Position={new UDim2(.5,0,0.05,0)} AnchorPoint={UIDIM.A_TOP} Size={UIDIM.ONE}>
			<uiaspectratioconstraint AspectRatio={10} />
			<uilistlayout SortOrder={Enum.SortOrder.LayoutOrder} Padding={new UDim(.05,0)} FillDirection={Enum.FillDirection.Vertical} HorizontalAlignment={Enum.HorizontalAlignment.Center}/>
			<ProgressBarComponent
				progress={new_progress}
				
				total_duration={0}
				Color={Color3.fromRGB(249, 65, 0)}
				Text={`${math.floor(new_progress * 100)}%`}
				AnchorPoint={new Vector2(0.5, 0)}
				Position={new UDim2(0.5, 0, 0.112, 0)}
				Size={new UDim2(.15,0,.15,0)}
			/>
			<GoofyText Size={UDim2.fromScale(.3,.2)} Text={`${getCheckpointDataFromIndex(tonumber(checkpoint.Name)||0)?.name}`}/>
		</frame>
	)
}
const getPreviousBigCheckpoint = (current: number) => {
	let found
	let i = current
	while (!found && i > 0) {
		const checkpoint = getCheckpointModelByIndex(i)
		if (!checkpoint) {
			return 0
		}
		if (checkpoint.FindFirstChild("Spawn")) {
			found = i
		}
		i -= 1
	}
	return found ||0
}
const getNextBigCheckpoint = (current: number) => {
	let found
	let i = current
	while (!found) {
		i += 1
		const checkpoint = getCheckpointModelByIndex(i)
		if (!checkpoint) {
			return current
		}
		if (checkpoint.FindFirstChild("Spawn")) {
			found = i
		}
	}
	return found
}