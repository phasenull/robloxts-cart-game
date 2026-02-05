import React, { forwardRef, ReactNode, useEffect, useMemo, useRef } from "react"
import { UIHelper } from "shared/ui.helper"
import { UIDIM } from "../../constants"
import { GoofyText } from "../goofy-text"
import { A } from "shared/assets"
import { useMouseEvents } from "../../hooks/useMouseEvents"
import useAnimateValue from "../../hooks/useAnimateValue"
interface GoofyButtonProps {
	Text: string
	OnClick: () => void
	Color?: Color3
	Size?: UDim2
	AnchorPoint?: Vector2
	Position?: UDim2
	Ratio?: number
	rotate?: number
	Disabled?: boolean
	Loading?: boolean
	Image?: string
	ZIndex?: number
	BackgroundImage?: string
	BackgroundImageProps?: React.InstanceProps<ImageLabel>
	CanvasClipping?: boolean
	DisablePopEffect?: boolean
	TextSize?: UDim2
}
export const GoofyButton = forwardRef<ImageButton, GoofyButtonProps>(
	(props, ref) => {
		const {
			Text,
			Color,
			Size,
			AnchorPoint,
			Position,
			Ratio,
			Disabled,
			Loading
		} = props
		const target_size = Size ?? new UDim2(1, 0, 0.3, 0)
		const callback = props.OnClick
		const thisRef = useRef<ImageButton>()
		const state = useMouseEvents(thisRef)
		const pop_amount = useAnimateValue({
			target_value: state.isMouseDown ? 1 : state.isMouseOver ? -1 : 0,
			tween_info: new TweenInfo(
				0.3,
				Enum.EasingStyle.Quint,
				Enum.EasingDirection.Out
			),
			enabled: !props.DisablePopEffect
		})
		const pop_offset = 0.09
		useEffect(() => {
			if (props.DisablePopEffect && thisRef.current) {
				UIHelper.bind(thisRef.current, props.rotate)
			}
			return () => {
				if (thisRef.current) {
					UIHelper.unbind(thisRef.current)
				}
			}
		}, [props.rotate])

		const target_color = props.Loading
			? new Color3(0.5, 0.5, 0.5)
			: Color || new Color3(0.81, 0.81, 0.81)
		const darken_color = target_color.Lerp(new Color3(0, 0, 0), 0.15)
		const light_color = target_color.Lerp(new Color3(1, 1, 1), 0.15)
		const very_light_color = target_color.Lerp(new Color3(1, 1, 1), 0.4)
		const very_dark_color = target_color.Lerp(new Color3(0, 0, 0), 0.5)
		return (
			<frame
				key={"goofy-button"}
				ZIndex={props.ZIndex || 1}
				Size={target_size}
				BackgroundTransparency={1}
				AnchorPoint={AnchorPoint || UIDIM.A_CENTER}
				Position={Position || UIDIM.CENTER}
			>
				{props.DisablePopEffect ? undefined : (
					<frame
						Position={new UDim2(0.5, 0, 0, 0)}
						AnchorPoint={UIDIM.A_TOP}
						BackgroundColor3={very_dark_color}
						BackgroundTransparency={0}
						Size={new UDim2(1, 0, 1 + pop_offset, 0)}
					>
						<uicorner CornerRadius={new UDim(0.2, 0)} />

						{props.DisablePopEffect ? undefined : (
							<uistroke
								Color={very_dark_color}
								Thickness={0.022}
								StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
								BorderStrokePosition={Enum.BorderStrokePosition.Outer}
							/>
						)}
					</frame>
				)}
				<imagebutton
					AutoButtonColor={false}
					ref={(e) => {
						thisRef.current = e
						if (ref) {
							if (typeOf(ref) === "function") {
								thisRef.current = e
							} else if (ref) {
								;(
									ref as React.MutableRefObject<ImageButton | undefined>
								).current = e
							}
						}
					}}
					Event={{
						MouseButton1Click: () => {
							if (!Disabled && !Loading) {
								callback?.()
							}
							if (Disabled || Loading) {
								UIHelper.playSound(A.sounds.error)
							}
						}
					}}
					Image={props.Image}
					Position={UIDIM.CENTER.add(
						new UDim2(
							0,
							0,
							pop_amount * 0.05 * (state.isMouseDown ? 0.5 : 0.6),
							0
						)
					)}
					AnchorPoint={UIDIM.A_CENTER}
					BackgroundColor3={new Color3(1, 1, 1)}
					BackgroundTransparency={props.Image ? 1 : 0}
					ScaleType={Enum.ScaleType.Fit}
					Size={new UDim2(1, 0, 1, 0)}
					ImageColor3={target_color}
					ClipsDescendants={props.CanvasClipping ?? false}
				>
					<uicorner CornerRadius={new UDim(0.2, 0)} />
					{!props.DisablePopEffect ? (
						<uigradient
							Color={
								new ColorSequence([
									new ColorSequenceKeypoint(
										0,
										light_color.Lerp(new Color3(1, 1, 1), 0.4)
									),
									new ColorSequenceKeypoint(1, target_color)
								])
							}
							Rotation={90}
						/>
					) : undefined}
					<GoofyText
						TextXAlignment={Enum.TextXAlignment.Center}
						Text={Text}
						AnchorPoint={UIDIM.A_CENTER}
						Size={props.TextSize || new UDim2(0.8, 0, 0.5, 0)}
						Position={UIDIM.CENTER}
						TextScaled={true}
						TextStrokeColor3={very_dark_color}
						MaxTextSize={100}
						Thickness={0.1}
						MinTextSize={1}
					/>
					{props.CanvasClipping ? (
						<canvasgroup
							Size={UIDIM.ONE}
							AnchorPoint={UIDIM.A_CENTER}
							Position={UIDIM.CENTER}
							BackgroundTransparency={1}
							Interactable={false}
						>
							{props.children}
							<uicorner CornerRadius={new UDim(0.2, 0)} />
						</canvasgroup>
					) : (
						props.children
					)}
					{props.DisablePopEffect ? undefined : (
						<uistroke
							Color={very_light_color}
							Thickness={0.05}
							StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
							BorderStrokePosition={Enum.BorderStrokePosition.Inner}
						/>
					)}
				</imagebutton>
				<uiaspectratioconstraint AspectRatio={Ratio ?? 2.5} />
			</frame>
		)
	}
)
