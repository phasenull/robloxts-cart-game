import { __IS_EDIT__ } from "shared/common/config.builder";import React, {
	createContext,
	useContext,
	useEffect,
	useState
} from "@rbxts/react"
import Signal from "@rbxts/signal"
import { network } from "shared/net"

export const CheckpointContext = createContext<{
	currentCheckpoint: number
	collectedCheckpoints: number[]
	refresh: () => Promise<void>
}>({
	currentCheckpoint: 0,
	collectedCheckpoints: [],
	refresh: async () => {}
})
export function CheckpointProvider(props: {
	children: React.ReactNode
	__story?: { mock_checkpoint: number }
}) {
	const [currentCheckpoint, setCurrentCheckpoint] = useState(
		0
	)
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
			network.client.CheckpointService.updateCheckpointState.on(
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
			collected_conn()
		}
	}, [])
	async function refresh() {
		return await network.client.CheckpointService.getCheckpointState
			.invokeWithTimeout(5)
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
				currentCheckpoint: props.__story?.mock_checkpoint ?? currentCheckpoint,
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
