import React, {
	createContext,
	useContext,
	useEffect,
	useState
} from "@rbxts/react"
import Signal from "@rbxts/signal"
import { ClientEvents, ClientFunctions } from "shared/network.helper"

export const CheckpointContext = createContext<{
	currentCheckpoint: number
	collectedCheckpoints: number[]
}>({
	currentCheckpoint: 0,
	collectedCheckpoints: []
})
export function CheckpointProvider(props: { children: React.ReactNode }) {
	const [currentCheckpoint, setCurrentCheckpoint] = useState(0)
	const [collectedCheckpoints, setCollectedCheckpoints] = useState<number[]>([])
	useEffect(() => {
		const changed_conn = CheckpointSignal.Connect((new_checkpoint) => {
			print(`Checkpoint changed: ${new_checkpoint}`)
			setCurrentCheckpoint(new_checkpoint)
		})
		const collected_conn =
			ClientEvents.CheckpointService.updateCheckpointState.connect(
				(new_collected, collected) => {
					print(
						`Received checkpoint update: ${new_collected} collected: ${collected}`
					)
					setCollectedCheckpoints(collected)
					setCurrentCheckpoint(new_collected)
				}
			)
		ClientFunctions.CheckpointService.getCheckpointState
			.invokeWithTimeout(5000)
			.then((result) => {
				if (!result) {
					print("Failed to get checkpoint state from server")
					return
				}
				const [data,err] = result

				if (!data || err) {
					print(`Error getting checkpoint state: ${err}`)
					return
				}
				const { current_checkpoint, collected_checkpoints } = data
				print(
					`Initial checkpoint state: ${current_checkpoint} collected: ${collected_checkpoints}`
				)
				setCurrentCheckpoint(current_checkpoint)
				setCollectedCheckpoints(collected_checkpoints)
			})
			.catch((err) => {
				print(`Error getting checkpoint state: ${err}`)
			})
		return () => {
			changed_conn.Disconnect()
			collected_conn.Disconnect()
		}
	}, [])
	return (
		<CheckpointContext.Provider
			value={{ currentCheckpoint, collectedCheckpoints }}
		>
			{props.children}
		</CheckpointContext.Provider>
	)
}
export const CheckpointSignal = new Signal<(new_checkpoint: number) => void>()
export function useCheckpoint() {
	return useContext(CheckpointContext)
}
