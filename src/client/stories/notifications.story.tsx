import React, { useEffect } from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps, Number } from "@rbxts/ui-labs"
import { NotificationsGui } from "client/ui/gui/main/notifications/notifications-gui"
import { NotificationProvider } from "client/ui/contexts/notification.context"
import { useNotifications } from "client/ui/contexts/notification.context"

const controls = {
	notification_count: Number(3, 0, 10, 1),
}

function NotificationStoryContent(props: { notification_count: number }) {
	const { addNotification, listNotifications } = useNotifications()

	useEffect(() => {
		const currentCount = listNotifications().size()
		const targetCount = props.notification_count

		if (targetCount > currentCount) {
			// Add notifications
			for (let i = currentCount; i < targetCount; i++) {
				const notificationTypes = [
					{
						title: "<b>Shield Activated!</b>",
						description: "<font color='#00D4FF'>10 seconds</font> of protection",
						duration: 5,
					},
					{
						title: "<b>Revives Earned!</b>",
						description: "<font color='#00FF88'>+5</font> revives",
						duration: 4,
					},
					{
						title: "<b>Flips Earned!</b>",
						description: "<font color='#FFD700'>+3</font> flips",
						duration: 4,
					},
					{
						title: "<b>Cash Earned!</b>",
						description: "<font color='#00FF00'>+$1000</font> - Checkpoint reached",
						duration: 4,
					},
					{
						title: "<b>Shield Extended!</b>",
						description: "<font color='#00D4FF'>+5 seconds</font> added",
						duration: 3,
					},
				]

				const notification = notificationTypes[i % notificationTypes.size()]
				addNotification(notification)
			}
		}
	}, [props.notification_count])

	return <NotificationsGui />
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<NotificationProvider>
				<NotificationStoryContent notification_count={props.controls.notification_count} />
			</NotificationProvider>
		)
	},
}

export = story
