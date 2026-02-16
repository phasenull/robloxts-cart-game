import React from "@rbxts/react"
import { useNotifications } from "client/ui/contexts/notification.context"
import { NotificationEntry } from "./notifiations-entry"

export function NotificationsGui() {
	const { listNotifications } = useNotifications()
	const notifications = listNotifications()

	return (
		<frame
			ZIndex={99}
			key="Notifications"
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundTransparency={1}
			Position={new UDim2(0.5, 0, 0.5, 0)}
			Size={new UDim2(0.7, 0, 0.7, 0)}
		>
			<uilistlayout
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				Padding={new UDim(0.01, 0)}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>
			<uiaspectratioconstraint
				AspectRatio={1.5}
				AspectType={Enum.AspectType.ScaleWithParentSize}
				DominantAxis={Enum.DominantAxis.Height}
			/>
			{notifications.map((notification) => (
				<NotificationEntry
					
					key={notification.id}
					id={notification.id}
					title={notification.title}
					description={notification.description}
					duration={notification.duration}
					soundId={notification.soundId}
				/>
			))}
		</frame>
	)
}
