import React from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { Players } from "@rbxts/services"
import { EmptyContainer } from "client/ui/components/empty-container"
import { GoofyText } from "client/ui/components/goofy-text"
import { Icon } from "client/ui/components/icon"
import { LoadingIndicator } from "client/ui/components/loading-indicator"
import { UIDIM } from "client/ui/constants"
import { A } from "shared/assets"

export function PlotSign(props: { owner_id: number; rebirths: number }) {
	const { owner_id, rebirths } = props
	const { data, err, isLoading } = useQuery({
		queryKey: [`plot-sign-${props.owner_id}`],
		queryFn: async () => {
			const user_info = Players.GetNameFromUserIdAsync(owner_id)
			const [avatar] = Players.GetUserThumbnailAsync(
				owner_id,
				"HeadShot",
				Enum.ThumbnailSize.Size100x100
			)
			return { user_info, avatar }
		}
	})
	if (isLoading) {
		;<EmptyContainer Size={new UDim2(0, 400, 0, 400)}>
			<LoadingIndicator Size={UIDIM.CENTER} />
		</EmptyContainer>
	}
	return (
		<EmptyContainer Size={new UDim2(0, 400, 0, 400)}>
			<imagelabel
				Size={new UDim2(0.5, 0, 0.5, 0)}
				Position={new UDim2(0.5, 0, 0, 0)}
				AnchorPoint={UIDIM.A_TOP}
				Image={data ? data.avatar : ""}
				BackgroundTransparency={1}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagelabel>
			<GoofyText
				Size={new UDim2(1, 0, 0.1, 0)}
				Position={new UDim2(0, 0, 0.43, 0)}
				Text={data ? data.user_info : `???(${owner_id})`}
				TextScaled={true}
				Font={Enum.Font.GothamBold}
				TextColor3={new Color3(1, 1, 1)}
				BackgroundTransparency={1}
			/>
			<frame
				BackgroundTransparency={1}
				AnchorPoint={UIDIM.A_TOP}
				Size={new UDim2(1, 0, 0.5, 0)}
				Position={UIDIM.CENTER}
			>
				<uigridlayout
					CellSize={new UDim2(1 / 2, 0, 1 / 4.5, 0)}
					CellPadding={new UDim2(0.2,0,0.05,0)}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					FillDirectionMaxCells={5}
				>
					<uiaspectratioconstraint AspectRatio={3} />
				</uigridlayout>
				<uipadding
					PaddingTop={new UDim(0.1, 0)}
					PaddingBottom={new UDim(0.1, 0)}
					PaddingLeft={new UDim(0.1, 0)}
					PaddingRight={new UDim(0.1, 0)}
				/>
				{[0, 1, 2, 3, 4, 5, 6, 7].map(() => (
					<frame BackgroundTransparency={1}>
						<GoofyText
							Size={new UDim2(1, 0, 1, 0)}
							Position={new UDim2(1/3+0.1, 0, 0.5, 0)}
							Text={`${rebirths}`}
							TextScaled={true}
							TextXAlignment={Enum.TextXAlignment.Left}
							AnchorPoint={UIDIM.A_LEFT}
							Font={Enum.Font.GothamBold}
							TextColor3={new Color3(1, 1, 1)}
							BackgroundTransparency={1}
						/>
						<Icon Image={A.icons.rebirth} Size={new UDim2(1, 0, 1, 0)}/>
					</frame>
				))}
			</frame>
		</EmptyContainer>
	)
}
