import React, { useEffect } from "@rbxts/react"
import { UIDIM } from "client/ui/constants"
import useAnimateValue from "client/ui/hooks/useAnimateValue"
import { useMouseEvents } from "client/ui/hooks/useMouseEvents"
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
	children?: React.ReactNode
	onDown?: (status: boolean) => void
}) {
	const thisRef = React.useRef<ImageButton>()
	const original_size = props.Size ?? new UDim2(0.6, 0, 0.1, 0)
	const { isMouseDown, isMouseOver } = useMouseEvents(thisRef)
	const is_mouse_down = props.mockMouseDown ?? isMouseDown
	const value = useAnimateValue({
		target_value: is_mouse_down ? 0.9 : isMouseOver ? 1.1 : 1,
		tween_info: new TweenInfo(
			0.3,
			Enum.EasingStyle.Quint,
			Enum.EasingDirection.Out
		)
	})
	useEffect(() => {
		if (props.onDown) {
			props.onDown(isMouseDown)
		}
	}, [isMouseDown])
	const target_color = props.Color ?? new Color3(1, 0, 0)
	const color_tinted = target_color.Lerp(new Color3(1, 1, 1), 0.6)
	return (
		<imagebutton
			Rotation={props.Rotation ?? 0}
			Event={{
				MouseButton1Click: props.onClick
			}}
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
				Size={new UDim2(1, 0, 0.7, 0)}
				BackgroundTransparency={1}
				FontFace={
					new Font(buildFontAssetId("GothamSSm"), Enum.FontWeight.ExtraBold)
				}
				Text={props.Text}
				Position={UIDIM.CENTER}
				AnchorPoint={UIDIM.A_CENTER}
				TextColor3={new Color3(1, 1, 1)}
				TextScaled
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
		</imagebutton>
	)
}
