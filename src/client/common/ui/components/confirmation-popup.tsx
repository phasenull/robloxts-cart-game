import React, { useEffect, useRef } from "@rbxts/react"
import useAnimateValue from "../hooks/useAnimateValue"
import { UIDIM } from "../constants"
import { UIHelper } from "../../ui.helper"

interface ConfirmationPopupProps {
	visible: boolean
	title: string
	message: string
	subtext?: string
	confirmText?: string
	cancelText?: string
	onConfirm: () => void
	onCancel: () => void
}

export function ConfirmationPopup({
	visible,
	title,
	message,
	subtext,
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
}: ConfirmationPopupProps) {
	const value = useAnimateValue({
		target_value: visible ? 1 : 0,
		tween_info: new TweenInfo(0.4, Enum.EasingStyle.Quint, Enum.EasingDirection.InOut),
	})

	const confirmRef = useRef<ImageButton>()
	const cancelRef = useRef<ImageButton>()

	useEffect(() => {
		const confirmBtn = confirmRef.current
		const cancelBtn = cancelRef.current
		const confirmBinding = confirmBtn ? UIHelper.bind(confirmBtn) : undefined
		const cancelBinding = cancelBtn ? UIHelper.bind(cancelBtn) : undefined
		return () => {
			UIHelper.unbind(confirmBinding)
			UIHelper.unbind(cancelBinding)
		}
	}, [confirmRef.current, cancelRef.current])

	if (value === 0) return undefined

	return (
		<frame
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			Position={new UDim2(0.5, 0, 0.5 + (1 - value), 0)}
			Size={new UDim2(0.396, 0, 0.304, 0).Lerp(UIDIM.ZERO, 1 - value)}
			ZIndex={10}
		>
			<uiaspectratioconstraint
				AspectRatio={2.013}
				AspectType={Enum.AspectType.ScaleWithParentSize}
				DominantAxis={Enum.DominantAxis.Height}
			/>
			<uigradient
				Rotation={90}
				Transparency={new NumberSequence([
					new NumberSequenceKeypoint(0, 0.6, 0),
					new NumberSequenceKeypoint(1, 0.256, 0),
				])}
			/>
			<uistroke Thickness={5} />
			{/* Title */}
			<textlabel
				AnchorPoint={new Vector2(1, 0.5)}
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				Position={new UDim2(0.441, 0, -0.039, 0)}
				Rotation={-8}
				Size={new UDim2(0.476, 0, 0.155, 0)}
				Text={title}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				TextXAlignment={Enum.TextXAlignment.Left}
				ZIndex={10}
			>
				<uistroke Thickness={3} />
			</textlabel>
			{/* Message */}
			<textlabel
				AnchorPoint={new Vector2(1, 0.5)}
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				Position={new UDim2(0.932, 0, 0.22, 0)}
				Size={new UDim2(0.863, 0, 0.252, 0)}
				Text={message}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				ZIndex={10}
			>
				<uistroke Thickness={3} />
			</textlabel>
			{/* Subtext (green accent line) */}
			{subtext !== undefined && (
				<textlabel
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.93, 0, 0.438, 0)}
					Size={new UDim2(0.863, 0, 0.14, 0)}
					Text={subtext}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					ZIndex={10}
				>
					<uistroke Thickness={3} />
					<uigradient
						Color={new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(66, 214, 0)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(255, 251, 0)),
						])}
						Rotation={-90}
					/>
				</textlabel>
			)}
			{/* Confirm button */}
			<imagebutton
				ref={confirmRef}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={new UDim2(0.27, 0, 0.8115, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.428, 0, 0.237, 0)}
				ZIndex={10}
				Event={{ MouseButton1Click: onConfirm }}
			>
				<uistroke Thickness={5} />
				<frame
					BackgroundColor3={Color3.fromRGB(0, 63, 8)}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.916, 0)}
					Size={new UDim2(1, 0, 0.084, 0)}
					ZIndex={10}
				/>
				<imagelabel
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://120250412681646"
					ImageTransparency={0.6}
					Position={new UDim2(0.5, 0, 0.477, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.876, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
					ZIndex={10}
				/>
				<frame
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BorderSizePixel={0}
					Position={new UDim2(0.5, 0, 0.457, 0)}
					Size={new UDim2(1, 0, 0.914, 0)}
					ZIndex={9}
				>
					<uigradient
						Color={new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(193, 252, 0)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(24, 199, 0)),
						])}
						Rotation={90}
					/>
				</frame>
				<textlabel
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.793, 0, 0.456, 0)}
					Size={new UDim2(0.592, 0, 0.747, 0)}
					Text={confirmText}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					ZIndex={11}
				>
					<uistroke Thickness={3} />
					<uitextsizeconstraint MaxTextSize={38} />
				</textlabel>
			</imagebutton>
			{/* Cancel button */}
			<imagebutton
				ref={cancelRef}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={new UDim2(0.728, 0, 0.8085, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.428, 0, 0.237, 0)}
				ZIndex={10}
				Event={{ MouseButton1Click: onCancel }}
			>
				<uistroke Thickness={5} />
				<frame
					BackgroundColor3={Color3.fromRGB(78, 0, 1)}
					BackgroundTransparency={0.05}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.916, 0)}
					Size={new UDim2(1, 0, 0.084, 0)}
					ZIndex={10}
				/>
				<imagelabel
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://120250412681646"
					ImageTransparency={0.6}
					Position={new UDim2(0.5, 0, 0.477, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.876, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
					ZIndex={10}
				/>
				<frame
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BorderSizePixel={0}
					Position={new UDim2(0.5, 0, 0.457, 0)}
					Size={new UDim2(1, 0, 0.914, 0)}
					ZIndex={9}
				>
					<uigradient
						Color={new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(252, 113, 0)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(199, 0, 0)),
						])}
						Rotation={90}
					/>
				</frame>
				<textlabel
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Position={new UDim2(0.793, 0, 0.482, 0)}
					Size={new UDim2(0.592, 0, 0.747, 0)}
					Text={cancelText}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					ZIndex={11}
				>
					<uistroke Thickness={3} />
					<uitextsizeconstraint MaxTextSize={38} />
				</textlabel>
			</imagebutton>
			{/* Shadow overlay */}
			<imagelabel
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.8}
				Position={new UDim2(0, 0, 0, 0)}
				Size={new UDim2(1, 0, 0.994, 0)}
				ZIndex={0}
			/>
		</frame>
	)
}
