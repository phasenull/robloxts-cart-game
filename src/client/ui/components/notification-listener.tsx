import React from "@rbxts/react"
import { useNotificationListener } from "../hooks/useNotificationListener"

export function NotificationListener({ children }: React.PropsWithChildren) {
	useNotificationListener()
	return <>{children}</>
}
