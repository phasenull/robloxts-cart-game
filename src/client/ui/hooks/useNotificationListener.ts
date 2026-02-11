import { useEffect } from "@rbxts/react"
import { ClientEvents } from "shared/network.helper"
import { useNotifications } from "../contexts/notification.context"

export function useNotificationListener() {
	const { addNotification } = useNotifications()

	useEffect(() => {
		const connection = ClientEvents.NotificationService.sendNotification.connect((notification) => {
			addNotification(notification)
		})

		return () => {
			connection.Disconnect()
		}
	}, [])
}
