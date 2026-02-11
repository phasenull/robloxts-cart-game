import React, { createContext, useContext, useState } from "@rbxts/react"
import { INotification } from "shared/type.helper"
import { HttpService } from "@rbxts/services"

interface INotificationWithId extends INotification {
	id: string
}

interface NotificationContextType {
	notifications: INotificationWithId[]
	addNotification: (notification: INotification) => void
	removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider(props: React.PropsWithChildren<{}>) {
	const [notifications, setNotifications] = useState<INotificationWithId[]>([])

	const addNotification = (notification: INotification) => {
		const id = HttpService.GenerateGUID(false)
		const duration = notification.duration ?? 3

		const newNotification: INotificationWithId = {
			...notification,
			id,
		}

		setNotifications((prev) => [...prev, newNotification])

		// Auto-remove after duration
		task.delay(duration, () => {
			setNotifications((prev) => prev.filter((n) => n.id !== id))
		})
	}

	const removeNotification = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id))
	}

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				addNotification,
				removeNotification,
			}}
		>
			{props.children}
		</NotificationContext.Provider>
	)
}

export function useNotifications() {
	const context = useContext(NotificationContext)
	if (!context) {
		throw "useNotifications must be used within NotificationProvider"
	}

	return {
		addNotification: context.addNotification,
		listNotifications: () => context.notifications,
	}
}
