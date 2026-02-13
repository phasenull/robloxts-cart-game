import React, { ReactNode } from "@rbxts/react"
import useAnimateValue from "../hooks/useAnimateValue"
import { GUI_KEYS, UIDIM } from "../constants"
import { GuiContext } from "../contexts/gui-manager.context"
import { capitalizeFirstLetter } from "shared/util.helper"
import { SidebarButton } from "./buttons/sidebar-button"
import { A } from "shared/assets"
import { useNavigator } from "../hooks/useNavigator"

export default function PopGui(props: {
	id: GUI_KEYS
	children?: ReactNode
	Size?: UDim2
	Position?: UDim2
	Visible?: boolean
	ZIndex?: number
	onClose?: () => void
	disable_default_close?: boolean
	hide_title?: boolean
	disable_aspect_ratio?: boolean
}) {
	const open_gui = React.useContext(GuiContext).open_gui
	const is_open = open_gui === props.id || props.Visible
	const navigator = useNavigator()
	const value = useAnimateValue({
		target_value: is_open ? 1 : 0,
		tween_info: new TweenInfo(
			0.4,
			Enum.EasingStyle.Quint,
			Enum.EasingDirection.InOut
		)
	})
	
	
	if (value === 0) return undefined
	print("open_gui:", open_gui, "is_open:", is_open)
	
	// If frame wrapper is disabled, just render children directly

	
	return (
		<frame
			BackgroundTransparency={1}
			AnchorPoint={new Vector2(0.5, 0.5)}
			Position={props.Position || new UDim2(0.5, 0, 0.5 + (1-value), 0)}
			Size={(props.Size || new UDim2(0.6, 0, 0.6, 0)).Lerp(UIDIM.ZERO, (1-value))}
			ZIndex={props.ZIndex}
		>
			{!props.disable_aspect_ratio && <uiaspectratioconstraint AspectRatio={(props.Size?.X.Scale||2)/(props.Size?.Y.Scale||1)} />}
			{ !props.hide_title && <textlabel
				Size={new UDim2(0.3, 0, 0.1, 0)}
				TextColor3={new Color3(1, 1, 1)}
				Font={Enum.Font.FredokaOne}
				AnchorPoint={new Vector2(0, 0.6)}
				Position={new UDim2(0, 0, 0, 0)}
				BackgroundTransparency={1}
				Text={capitalizeFirstLetter(props.id || "?")}
				TextScaled={true}
				ZIndex={2}
			>
				<uistroke
					Color={new Color3(0, 0, 0)}
					Thickness={0.1}
					StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				/>
				<uitextsizeconstraint MaxTextSize={72} MinTextSize={10} />
			</textlabel>}
			{props.children}
			{!props.disable_default_close && <SidebarButton
				icon={A.icons.cross}
				Size={new UDim2(0.14, 0, 0.14, 0)}
				Position={new UDim2(1, 0, 0, 0)}
				AnchorPoint={new Vector2(0.7, 0.5)}
				BackgroundTransparency={1}
				callback={() => {
					props.onClose?.()
					if (props.disable_default_close) return
					navigator.closeAll()
				}}
				ZIndex={2}
			/>}
		</frame>
	)
}
