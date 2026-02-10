import React, {
	createContext,
	useContext,
	useEffect,
	useState
} from "@rbxts/react"
import Signal from "@rbxts/signal"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { ClientEvents, ClientFunctions } from "shared/network.helper"

export const CheckpointContext = createContext<{
	currentCheckpoint: number
	collectedCheckpoints: number[]
	refresh: () => Promise<void>
}>({
	currentCheckpoint: 0,
	collectedCheckpoints: [],
	refresh: async () => {}
})
export function CheckpointProvider(props: { children: React.ReactNode }) {
	const [currentCheckpoint, setCurrentCheckpoint] = useState(0)
	const [collectedCheckpoints, setCollectedCheckpoints] = useState<number[]>([])
	useEffect(() => {
		if (__IS_EDIT__) {
			setCollectedCheckpoints([0, 2, 4])
			return
		}
		const changed_conn = CheckpointSignal.Connect((new_checkpoint) => {
			print(`Checkpoint changed: ${new_checkpoint}`)
			setCurrentCheckpoint(new_checkpoint)
		})
		refresh()
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

		return () => {
			changed_conn.Disconnect()
			collected_conn.Disconnect()
		}
	}, [])
	async function refresh() {
		return await ClientFunctions.CheckpointService.getCheckpointState
			.invokeWithTimeout(5000)
			.then((result) => {
				if (!result) {
					print("Failed to get checkpoint state from server")
					return
				}
				const [data, err] = result

				if (!data || err) {
					print(`Error getting checkpoint state: ${err}`)
					return
				}
				const { current_checkpoint, collected_checkpoints } = data
				// print(
				// 	`Initial checkpoint state: ${current_checkpoint} collected: ${collected_checkpoints.join(", ")}`
				// )
				setCurrentCheckpoint(current_checkpoint)
				setCollectedCheckpoints(collected_checkpoints)
			})
			.catch((err) => {
				print(`Error getting checkpoint state: ${err}`)
			})
	}
	return (
		<CheckpointContext.Provider
			value={{
				currentCheckpoint,
				collectedCheckpoints,
				refresh: () => refresh()
			}}
		>
			{props.children}
		</CheckpointContext.Provider>
	)
}
export const CheckpointSignal = new Signal<(new_checkpoint: number) => void>()
export function useCheckpoint() {
	return useContext(CheckpointContext)
}
