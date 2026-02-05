import { Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import React from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { Players } from "@rbxts/services"
import { PlotClientComponent } from "client/components/plot.client.component"
import { EmptyContainer } from "client/ui/components/empty-container"
import { GoofyText } from "client/ui/components/goofy-text"
import { LoadingIndicator } from "client/ui/components/loading-indicator"
import { SidebarButton } from "client/ui/components/buttons/sidebar-button"
import { __STUDIO__, PRIMARY, UIDIM } from "client/ui/constants"
import { useErrorPage } from "client/ui/contexts/error.context"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { A } from "shared/assets"

export function PlotGui() {
	const { showError,clearErrors } = useErrorPage()
	const navigator = useNavigator()
	const { data, err, isLoading, refetch } = useQuery({
		queryKey: "plotData",
		queryFn: async () => {
			// task.wait(3)
			// showError({
			// 	message: "Failed to load plot data: NOT IMPLEMENTED",
			// 	title: "Failed to load plot data",
			// 	onClose: () => {
			// 		navigator.closeAll()

			// 	},
			// 	retry: async () => {
			// 		clearErrors()
			// 		await refetch()
			// 	}
			// })
			if (__STUDIO__)
				return [
					{
						attributes: { owner: 1 }
					}
				]
			const components = Dependency<Components>()
			const all_plots = components.getAllComponents<PlotClientComponent>()
			return all_plots
		}
	})
	if (err) {
		return <EmptyContainer />
	}
	return (
		<imagelabel
			Size={UIDIM.ONE}
			AnchorPoint={UIDIM.A_CENTER}
			Position={UIDIM.CENTER}
			ScaleType={Enum.ScaleType.Crop}
			Image={A.ui.waves4}
			BackgroundColor3={PRIMARY}
			ImageTransparency={0.6}
		>
			{isLoading ? <LoadingIndicator /> : undefined}
			<uicorner CornerRadius={new UDim(0.1, 0)} />
			{data ? (
				<frame Size={new UDim2(0.3, 0, 1, 0)} BackgroundTransparency={0.5}>
					<GoofyText
						Text={"my plot"}
						Size={new UDim2(1, 0, 1, 0)}
						Ratio={4}
					></GoofyText>
				</frame>
			) : undefined}
		</imagelabel>
	)
}
