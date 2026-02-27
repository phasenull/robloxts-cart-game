import { UIHelper } from "@common/client/ui.helper";import useAnimateValue from "@common/client/ui/hooks/useAnimateValue";import React, { useState, useEffect } from "@rbxts/react"

interface NotificationEntryProps {
	id: string
	title: string
	description: string
	duration?: number
	soundId?: string
}

export function NotificationEntry({ id, title, description, duration = 3, soundId }: NotificationEntryProps) {
	const [isAppearing, setIsAppearing] = useState(true)
	const fullText = `${title}: ${description}`
	const textLength = fullText.size()

	// Fade in animation
	const transparency = useAnimateValue({
		target_value: 0,
		initial_value: 1,
		tween_info: new TweenInfo(0.4, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
	})

	// Scale animation (grow from small to full size)
	const scale = useAnimateValue({
		target_value: 1,
		initial_value: 0.7,
		tween_info: new TweenInfo(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
	})

	// Text reveal animation
	const maxGraphemes = useAnimateValue({
		target_value: textLength,
		initial_value: 0,
		tween_info: new TweenInfo(0.6, Enum.EasingStyle.Linear, Enum.EasingDirection.Out),
	})

	useEffect(() => {
		setIsAppearing(false)
		if (soundId) {
			UIHelper.playSound(soundId)
		}
	}, [])

	return (
		<canvasgroup
			key={id}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundTransparency={1}
			Position={new UDim2(0.5, 0, 0.029, 0)}
			Size={new UDim2(0.745, 0, 0.058, 0)}
			ZIndex={100}
			GroupTransparency={transparency}
		>
			<frame
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				BackgroundColor3={Color3.fromRGB(0, 36, 62)}
				BorderSizePixel={0}
				ZIndex={100}
				Size={new UDim2(scale, 0, scale, 0)}
			>
				<textlabel
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Heavy, Enum.FontStyle.Normal)
					}
					ZIndex={101}
					Position={new UDim2(0.18, 0, 0.068, 0)}
					Size={new UDim2(0.641, 0, 0.827, 0)}
					Text={fullText}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					RichText={true}
					MaxVisibleGraphemes={math.floor(maxGraphemes)}
				>
					<uistroke 
						Thickness={3}
						Transparency={0.2}
					/>
				</textlabel>
				<uigradient
					Transparency={
						new NumberSequence([
							new NumberSequenceKeypoint(0, 1),
							new NumberSequenceKeypoint(0.499, 0.394),
							new NumberSequenceKeypoint(1, 1),
						])
					}
				/>
				<uistroke
					Color={Color3.fromRGB(100, 200, 255)}
					Thickness={2}
					Transparency={0.5}
				/>
				<uicorner CornerRadius={new UDim(0.1, 0)} />
			</frame>
		</canvasgroup>
	)
}