import { useEffect } from "@rbxts/react"
import { network } from "shared/net"
import { useNotifications } from "../contexts/notification.context"
import { __IS_EDIT__ } from "shared/common/config.builder";

export function useNotificationListener() {
	const { addNotification } = useNotifications()

	useEffect(() => {
		if (__IS_EDIT__) return
		const connection = network.client.NotificationService.sendNotification.on((notification) => {
			addNotification(notification)
		})

		return () => {
			connection()
		}
	}, [])
}
