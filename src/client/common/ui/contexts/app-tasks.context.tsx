import React, { createContext, useContext, useState } from "@rbxts/react"
import { Tasks } from "shared/tasks"
import { useTasks } from "../hooks/useTasks"

const AppTasksContext = createContext<Tasks | undefined>(undefined)

/** Owns the UI's threads that outlive the component starting them; cancelled when the UI root unmounts (a swap). */
export function AppTasksProvider(props: React.PropsWithChildren<{}>) {
	const tasks = useTasks()
	return <AppTasksContext.Provider value={tasks}>{props.children}</AppTasksContext.Provider>
}

/**
 * Threads that must outlive the component that starts them (a fade it began before closing itself, an exit animation
 * from an effect cleanup). Without the provider (a UI Labs story) they get an owner of their own.
 */
export function useAppTasks(): Tasks {
	const [fallback] = useState(() => new Tasks())
	return useContext(AppTasksContext) ?? fallback
}
