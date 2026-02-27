import { useEffect } from "@rbxts/react"
import { ClientEvents } from "shared/network.helper"
import { useNotifications } from "../contexts/notification.context"
import { __IS_EDIT__ } from "@common/shared/config.builder";

export function useNotificationListener() {
	const { addNotification } = useNotifications()

	useEffect(() => {
		if (__IS_EDIT__) return
		const connection = ClientEvents.NotificationService.sendNotification.connect((notification) => {
			addNotification(notification)
		})

		return () => {
			connection.Disconnect()
		}
	}, [])
}
