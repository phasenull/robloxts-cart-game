import React, { useEffect } from "@rbxts/react"
import { UIHelper } from "client/ui.helper"
import { GAMEPAD_BUTTONS, IActionKeyMap, MOUSE_KEYBOARD_BUTTONS, UIDIM } from "client/ui/constants"
import { Icon } from "client/ui/components/icon"
import useAnimateValue from "client/ui/hooks/useAnimateValue"
import { useInput } from "client/ui/hooks/useInput"
import { useActionImage } from "client/ui/hooks/useKeyImage"
import { useInputType } from "client/ui/hooks/useInputType"
import { useMouseEvents } from "client/ui/hooks/useMouseEvents"
import { useMouseHover } from "client/ui/hooks/useMouseHover"
import { A } from "shared/assets"
import { buildFontAssetId } from "shared/util.helper"

export function RottenButton(props: {
	onClick?: () => void
	Size?: UDim2
	Position?: UDim2
	AnchorPoint?: Vector2
	Color?: Color3
	ZIndex?: number
	Text: string
	Ratio?: number
	Rotation?: number
	mockMouseDown?: boolean
	LayoutOrder?: number
	children?: React.ReactNode
	bindKey?: Enum.KeyCode
	onDown?: (status: boolean) => void
	action?: keyof IActionKeyMap
	overrideDevice?: "Gamepad" | "Keyboard" | "Mobile"
}) {
	const thisRef = React.useRef<ImageButton>()
	const device = props.overrideDevice ?? useInputType()
	const actionImage = useActionImage(props.action, device)
	const kbKey = props.action
		? (MOUSE_KEYBOARD_BUTTONS as Partial<Record<keyof IActionKeyMap, Enum.KeyCode>>)[props.action]
		: undefined
	const effectiveBindKey = props.bindKey ?? (props.action
		? (device === "Gamepad" ? GAMEPAD_BUTTONS[props.action] : kbKey)
		: undefined)
	const resolvedKeyCode = effectiveBindKey ?? (props.action
		? (device === "Gamepad" ? GAMEPAD_BUTTONS[props.action] : kbKey)
		: undefined)
	const iconAspectRatio = resolvedKeyCode === Enum.KeyCode.Space ? 2 : 1
	const original_size = props.Size ?? new UDim2(0.6, 0, 0.1, 0)
	const [is_subbed_key_down, set_id_subbed_key_down] = React.useState(false)
	const { isMouseDown, isMouseOver } = useMouseEvents(thisRef)
	function processClick() {
		props.onClick?.()
	}
	useInput({
		key: effectiveBindKey || Enum.KeyCode.Unknown,
		enabled: effectiveBindKey !== undefined,
		handler: (pressed) => {
			set_id_subbed_key_down(pressed)
			props.onDown?.(pressed)
			if (pressed === false) {
				if (props.onClick) {
					processClick()
				}
			}
		}
	})
	const is_mouse_down =
		props.mockMouseDown ?? (isMouseDown || is_subbed_key_down)
	const value = useAnimateValue({
		target_value: is_mouse_down ? 0.9 : isMouseOver ? 1.1 : 1,
		tween_info: new TweenInfo(
			0.3,
			Enum.EasingStyle.Quint,
			Enum.EasingDirection.Out
		)
	})
	useMouseHover(thisRef, (isHovering) => {
		if (isHovering) {
			UIHelper.playSound(A.sounds.click_kaan)
		}
	})
	const target_color = props.Color ?? new Color3(1, 0, 0)
	const color_tinted = target_color.Lerp(new Color3(1, 1, 1), 0.6)
	return (
		<imagebutton
			Rotation={props.Rotation ?? 0}
			Event={{
				MouseButton1Click: processClick,
				MouseButton1Down: () => {
					UIHelper.playSound(A.sounds.click_hard)
					props.onDown?.(true)
				},
				MouseButton1Up: () => props.onDown?.(false)
			}}
			LayoutOrder={props.LayoutOrder}
			ZIndex={props.ZIndex}
			Position={props.Position}
			AnchorPoint={props.AnchorPoint}
			ref={thisRef}
			BackgroundColor3={new Color3(1, 1, 1)}
			Size={original_size.add(UIDIM.ZERO.Lerp(original_size, value - 1))}
		>
			<uiaspectratioconstraint AspectRatio={props.Ratio ?? 2} />

			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, target_color),
						new ColorSequenceKeypoint(1, color_tinted)
					])
				}
				Rotation={-90}
			/>

			<uistroke
				Thickness={3}
				StrokeSizingMode={Enum.StrokeSizingMode.FixedSize}
				Color={Color3.fromRGB(30, 30, 30)}
			/>
			<imagelabel
				key={"background_tile"}
				Image={A.ui.tile}
				Size={UIDIM.ONE}
				Position={UIDIM.CENTER}
				AnchorPoint={UIDIM.A_CENTER}
				BackgroundTransparency={1}
				TileSize={new UDim2(0, 100, 0, 100)}
				ScaleType={Enum.ScaleType.Tile}
				ImageTransparency={0.7}
			/>
			<textlabel
				Size={new UDim2(0.9, 0, 0.5, 0)}
				BackgroundTransparency={1}
				FontFace={
					new Font(buildFontAssetId("GothamSSm"), Enum.FontWeight.ExtraBold)
				}
				Text={props.Text}
				Position={UIDIM.CENTER}
				AnchorPoint={UIDIM.A_CENTER}
				TextColor3={new Color3(1, 1, 1)}
				TextScaled={true}
				SizeConstraint={Enum.SizeConstraint.RelativeXX}
				key={"text"}
			>
				<uistroke
					Thickness={3}
					StrokeSizingMode={Enum.StrokeSizingMode.FixedSize}
					Color={Color3.fromRGB(40, 40, 40)}
				/>
			</textlabel>
			<imagelabel
				Size={UIDIM.ONE}
				BackgroundTransparency={1}
				ImageTransparency={0.5}
				ImageColor3={color_tinted}
				Image={A.ui.inner_shadow}
				key={"inner_shadow"}
			/>
			<frame
				Size={new UDim2(1, 0, 0.05, 0)}
				AnchorPoint={UIDIM.A_BOTTOM}
				Position={UIDIM.BOTTOM_CENTER}
				BackgroundColor3={new Color3(0, 0, 0)}
				Transparency={0.4}
				BorderSizePixel={0}
				key={"inner_shadow_bottom"}
			/>
			{actionImage && device !== "Keyboard" ? (
				<Icon
					Image={actionImage}
					AnchorPoint={UIDIM.A_CENTER}
					Size={device === "Gamepad" ? new UDim2(0.5, 0, 0.5, 0) : new UDim2(0.3, 0, 0.3, 0)}
					Position={UIDIM.TOP_RIGHT.add(new UDim2(0.01, 0, -0.05, 0))}
					Color3={new Color3(0.36, 0.66, 1)}
					Transparency={0.1}
					ScaleType={Enum.ScaleType.Fit}
					escape_ratio={iconAspectRatio !== 1}
				>
					<uiaspectratioconstraint AspectRatio={iconAspectRatio} />
				</Icon>
			) : undefined}
			{props.children}
		</imagebutton>
	)
}
