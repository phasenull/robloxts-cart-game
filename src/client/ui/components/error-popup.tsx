import { useContext } from "@rbxts/react"
import { ErrorContext } from "../contexts/error.context"
import PopGui from "./pop-gui"
import React from "@rbxts/react"
import { UIDIM } from "../constants"
import { A } from "shared/assets"
import { Icon } from "./icon"
import { GoofyText } from "./goofy-text"
import { GoofyButton } from "./buttons/goofy-button"
import { useMutation } from "@rbxts/react-query"
export function ErrorPopup() {
	const err = useContext(ErrorContext)?.err
	const is_visible = err !== undefined
	const { data, mutate, isLoading } = useMutation({
		mutationFn: async () => {
			await err?.retry?.()
			return true
		}
	})
	return (
		<PopGui
			disable_default_close
			ZIndex={2}
			Size={new UDim2(0.4, 0, 0.3, 0)}
			id="error"
			Visible={is_visible}
			onClose={() => {
				err?.onClose()
			}}
			hide_title
		>
			<imagelabel
				Size={new UDim2(1, 0, 1, 0)}
				BackgroundColor3={new Color3(1, 1, 1)}
				ScaleType={Enum.ScaleType.Slice}
				SliceCenter={new Rect(10, 10, 90, 90)}
			>
				<uipadding
					PaddingLeft={new UDim(0.1, 0)}
					PaddingRight={new UDim(0.1, 0)}
					PaddingBottom={new UDim(0.05, 0)}
				/>
				<uicorner CornerRadius={new UDim(0.05, 0)} />
				<frame
					Size={new UDim2(1, 0, 0.1, 0)}
					BackgroundTransparency={1}
					Position={new UDim2(0, 0, 0.1, 0)}
				>
					<Icon
						Size={new UDim2(1, 0, 1, 0)}
						Position={new UDim2(-0.05,0,0,0)}
						Image={A.icons.warning}
						AnchorPoint={UIDIM.A_CENTER}
					/>
					<Icon
						Size={new UDim2(1, 0, 1, 0)}
						Position={new UDim2(1.05, 0, 0, 0)}
						AnchorPoint={UIDIM.A_CENTER}
						Image={A.icons.warning}
					/>
					<GoofyText
						TextXAlignment={Enum.TextXAlignment.Center}
						Text={err?.title || "???"}
						AnchorPoint={UIDIM.A_CENTER}
						Size={new UDim2(.9, 0, 1, 0)}
						Position={new UDim2(0.5, 0, 0, 0)}
					/>
				</frame>
				<GoofyText
					Selectable
					TextXAlignment={Enum.TextXAlignment.Left}
					Text={err?.message || "???"}
					AnchorPoint={UIDIM.A_CENTER}
					Size={new UDim2(1.1, 0, 0.55, 0)}
					Position={new UDim2(0.5, 0, 0.45, 0)}
					MaxTextSize={24}
					Thickness={0}
					ZIndex={1}
					TextColor3={new Color3()}
					Font={Enum.Font.Roboto}
				/>

				<frame
					Size={new UDim2(1, 0, 0.2, 0)}
					BackgroundTransparency={1}
					ZIndex={2}
					AnchorPoint={UIDIM.A_BOTTOM}
					Position={UIDIM.BOTTOM_CENTER}
				>
					<uigridlayout
						CellSize={new UDim2(0.35, 0, 1, 0)}
						HorizontalAlignment={Enum.HorizontalAlignment.Center}
						FillDirectionMaxCells={0}
						FillDirection={Enum.FillDirection.Vertical}
					/>
					{err?.retry ? (
						<GoofyButton
							ZIndex={2}
							Loading={isLoading}
							OnClick={mutate}
							Color={new Color3(0.07, 0.63, 0.95)}
							Text={isLoading ? "Loading..." : "Retry"}
						/>
					) : undefined}
					<GoofyButton
						ZIndex={2}
						OnClick={() => {
							err?.onClose()
						}}
						Color={new Color3(0, 0.7, 0)}
						Text="OK"
					/>
				</frame>
			</imagelabel>
		</PopGui>
	)
}
