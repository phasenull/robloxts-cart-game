import React from "@rbxts/react"

interface NotificationEntryProps {
	id: string
	title: string
	description: string
}

export function NotificationEntry({ id, title, description }: NotificationEntryProps) {
	return (
		<frame
			key={id}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			Position={new UDim2(0.5, 0, 0.029, 0)}
			Size={new UDim2(0.745, 0, 0.058, 0)}
			ZIndex={0}
		>
			<textlabel
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				FontFace={
					new Font("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Heavy, Enum.FontStyle.Normal)
				}
				Position={new UDim2(0.18, 0, 0.068, 0)}
				Size={new UDim2(0.641, 0, 0.827, 0)}
				Text={`${title}: ${description}`}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				RichText={true}
			>
				<uistroke Thickness={3} />
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
		</frame>
	)
}