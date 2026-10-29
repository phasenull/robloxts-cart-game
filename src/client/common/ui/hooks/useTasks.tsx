import { useEffect, useState } from "@rbxts/react"
import { Tasks } from "shared/tasks"

/**
 * task.spawn / delay / defer for a React component: every thread still pending or running is cancelled when the
 * component unmounts. The UI root unmounts with UIController's trove, so a swap stops them with the generation.
 */
export function useTasks(): Tasks {
	const [tasks] = useState(() => new Tasks())
	useEffect(() => () => tasks.cancelAll(), [])
	return tasks
}
