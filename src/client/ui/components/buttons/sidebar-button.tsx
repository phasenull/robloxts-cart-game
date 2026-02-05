import React, { useContext, useEffect, useRef, useState } from "@rbxts/react"
import { UIHelper } from "shared/ui.helper"
import { GUI_KEYS, PRIMARY, UIDIM } from "../../constants"
import { A } from "shared/assets"
import { capitalizeFirstLetter } from "shared/util.helper"
import { GuiContext } from "../../contexts/gui-manager.context"
import { useNavigator } from "../../hooks/useNavigator"
import useAnimateValue from "../../hooks/useAnimateValue"
import { UserInputService } from "@rbxts/services"
import { Sparkle } from "../sparkle"
export function SidebarButton(props: {
	Size?: UDim2
	icon: string
	rotate?: number
	callback?: () => void
	ui_key?: GUI_KEYS
	Position?: UDim2
	AnchorPoint?: Vector2
	BackgroundTransparency?: number
	BackgroundColor3?: Color3
	ZIndex?: number
	children?: React.ReactNode
	shine?: boolean
}) {
	const size = props.Size ?? new UDim2(1, 0, 1, 0)
	const callback = props.callback ?? (() => {})
	const thisRef = useRef<ImageButton>()
	const navigator = useNavigator()
	const open_gui = navigator.openGui
	const is_selected = open_gui !== undefined && open_gui === props.ui_key
	const [is_hovering, setIsHovering] = useState(false)

	const value = useAnimateValue({
		initial_value: 0,
		target_value: is_hovering ? 100 : 0,
		tween_info: new TweenInfo(
			0.3,
			Enum.EasingStyle.Sine,
			Enum.EasingDirection.InOut,
			-1,
			true
		),
		enabled: is_hovering && props.ui_key !== "close"
	})
	useEffect(() => {
		let conn = undefined as RBXScriptConnection | undefined
		if (thisRef.current) {
			UIHelper.bind(thisRef.current, props.rotate)
			const listener = UIHelper.getEventListener(thisRef.current)
			conn = listener?.Connect((event, state) => {
				if (event === "hover") {
					setIsHovering(state)
				}
			})
		}
		return () => {
			if (thisRef.current) {
				UIHelper.unbind(thisRef.current)
			}
			conn?.Disconnect()
		}
	}, [])
	const target_color = props.BackgroundColor3 ?? PRIMARY
	return (
		<imagelabel
			AnchorPoint={props.AnchorPoint}
			Image={A.ui.rays}
			ScaleType={Enum.ScaleType.Crop}
			ImageTransparency={props.BackgroundTransparency ?? 0.7}
			BackgroundTransparency={
				props.BackgroundTransparency === undefined
					? 0
					: props.BackgroundTransparency
			}
			ClipsDescendants={false}
			BackgroundColor3={
				is_selected ? target_color.Lerp(new Color3(1, 1, 1), 0.5) : target_color
			}
			Size={size}
			Position={props.Position}
			ZIndex={props.ZIndex}
		>

			{/* corner */}
			<imagelabel
				Size={new UDim2(1.3, 0, 1.3, 0)}
				BackgroundTransparency={1}
				Image={A.ui.corner}
				ZIndex={2}
				AnchorPoint={UIDIM.A_CENTER}
				Position={UIDIM.CENTER}
				SliceCenter={new Rect(new Vector2(195, 174), new Vector2(221, 199))}
				ScaleType={Enum.ScaleType.Slice}
				Active={false}
				Selectable={false}
				Interactable={false}
				ImageTransparency={is_selected ? 0 : 1}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagelabel>
			<uiaspectratioconstraint AspectRatio={1} />
			<uicorner CornerRadius={new UDim(0.2, 0)} />
			{props.shine ? <Sparkle /> : undefined}
			<imagebutton
				ref={thisRef}
				Event={{
					MouseButton1Click: () => {
						callback?.()
						if (props.ui_key) {
							navigator.setOpenGui(props.ui_key)
						}
					}
				}}
				ZIndex={2}
				BackgroundTransparency={1}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={new UDim2(0.5, 0, 0.5 - value / 100 / 20, 0)}
				Size={new UDim2(1, 0, 1, 0)}
				Image={`${props.icon}`}
				Rotation={is_hovering ? (value / 100 - 0.5) * 10 : 0}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</imagebutton>
			{props.children}
			<textlabel
				Size={new UDim2(0.8, 0, 0.3, 0)}
				TextColor3={new Color3(1, 1, 1)}
				Font={Enum.Font.FredokaOne}
				AnchorPoint={new Vector2(0.5, 0.7)}
				Position={new UDim2(0.5, 0, 1, 0)}
				BackgroundTransparency={1}
				Text={capitalizeFirstLetter(props.ui_key || "")}
				TextScaled={true}
				ZIndex={3}
			>
				<uistroke
					Color={new Color3(0, 0, 0)}
					Thickness={0.15}
					StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				/>
				{<uitextsizeconstraint MaxTextSize={36} MinTextSize={10} />}
			</textlabel>
		</imagelabel>
	)
}
