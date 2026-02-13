import React from "@rbxts/react"
import { QueryClient, QueryClientProvider } from "@rbxts/react-query"
import ReactRoblox from "@rbxts/react-roblox"
import { Choose, InferFusionProps, Number } from "@rbxts/ui-labs"
import { StageProgress } from "client/ui/gui/cart/stage-progress"
import { CartProvider } from "client/ui/contexts/cart.context"
import { CheckpointProvider } from "client/ui/gui/cart/hooks/useCheckpoint"
import { Workspace } from "@rbxts/services"
import { getCheckpointModelByIndex, getPreviousBigCheckpoint, getNextBigCheckpoint } from "shared/cart.helper"

const controls = {
	current_checkpoint: Number(1, 0, 10, 1),
	mock_cart_position_progress: Number(0.5, 0, 1, 0.01),
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		// Calculate mock cart position based on checkpoint and progress
		const current_checkpoint = props.controls.current_checkpoint
		const progress = props.controls.mock_cart_position_progress
		
		const prev_checkpoint = getCheckpointModelByIndex(
			getPreviousBigCheckpoint(current_checkpoint)
		)
		const next_checkpoint = getCheckpointModelByIndex(
			getNextBigCheckpoint(current_checkpoint)
		)
		
		let mock_position = new Vector3(0, 10, 0)
		
		if (prev_checkpoint && next_checkpoint) {
			const prev_position = (
				(prev_checkpoint.FindFirstChild("Trigger") ||
					prev_checkpoint.FindFirstChild("Spawn")) as BasePart
			)?.Position
			
			const next_position = (
				(next_checkpoint.FindFirstChild("Trigger") ||
					next_checkpoint.FindFirstChild("Spawn")) as BasePart
			)?.Position
			
			if (prev_position && next_position) {
				// Lerp position based on progress
				mock_position = prev_position.Lerp(next_position, progress)
			}
		}
		
		// Create a mock cart with minimum required structure
		const mock_cart = {
			instance: {
				FindFirstChild(name: string) {
					if (name === "Root") {
						return {
							Position: mock_position
						} as BasePart
					}
					return undefined
				}
			} as Model
		} as any

		return (
			<QueryClientProvider value={new QueryClient({})}>
				<CartProvider __story={{ mock_cart }}>
					<CheckpointProvider __story={{ mock_checkpoint: current_checkpoint }}>
							<StageProgress />
					</CheckpointProvider>
				</CartProvider>
			</QueryClientProvider>
		)
	},
	summary: "Stage progress bar showing player advancement between checkpoints. Adjust the checkpoint number to switch stages, and use the progress slider to simulate the cart moving between checkpoints."
}

export = story
