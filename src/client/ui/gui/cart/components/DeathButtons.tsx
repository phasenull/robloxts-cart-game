import { Dependency } from "@flamework/core"
import React from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { UserInputService } from "@rbxts/services"
import { CartController } from "client/controllers/cart.controller"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { GoofyText } from "client/ui/components/goofy-text"
import { Icon } from "client/ui/components/icon"
import { GAMEPAD_BUTTONS, UIDIM } from "client/ui/constants"
import { useInput } from "client/ui/hooks/useInput"
import { useInputType } from "client/ui/hooks/useInputType"

interface DeathButtonsProps {
	shouldShow: boolean
	transparency: number
	onConfirmReset: () => void
	onRevive: () => void
	isResetPending?: boolean
}

export function DeathButtons({
	shouldShow,
	transparency,
	onConfirmReset,
	onRevive,
	isResetPending
}: DeathButtonsProps) {
	const device = useInputType()

	const { mutate: mutateRevive } = useMutation({
		queryKey: ["death-revive"],
		mutationFn: async () => {
			const controller = Dependency<CartController>()
			controller.promptRevive()
			onRevive()
			return true
		}
	})

	const { mutate: mutateReset } = useMutation({
		queryKey: ["death-reset"],
		mutationFn: async () => {
			onConfirmReset()
			return true
		}
	})

	useInput({
		key: GAMEPAD_BUTTONS.REVIVE,
		handler: (value) => value && mutateRevive(),
		enabled: shouldShow
	})

	useInput({
		key: GAMEPAD_BUTTONS.CONFIRM_RESET,
		handler: (value) => value && mutateReset(),
		enabled: shouldShow && !isResetPending
	})

	return (
		<imagelabel
			Size={UDim2.fromScale(0.2, 0.2)}
			AnchorPoint={UIDIM.A_BOTTOM}
			Position={UDim2.fromScale(0.5, 0.95 + 1 - transparency)}
		>
			<uiaspectratioconstraint AspectRatio={4} />
			<uilistlayout
				Padding={new UDim(0.3, 0)}
				FillDirection={Enum.FillDirection.Horizontal}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>
			<RottenButton
				Size={UIDIM.ONE}
				onDown={(val) => val && mutateReset()}
				Text="RESET"
			>
				<GoofyText
					MinTextSize={1}
					Size={UDim2.fromScale(1, 0.3)}
					Position={UIDIM.BOTTOM_CENTER}
					AnchorPoint={UIDIM.A_TOP.add(new Vector2(0, 0.1))}
					Text={"(last checkpoint)"}
				></GoofyText>
				{device === "Gamepad" && (
					<Icon
						Size={new UDim2(0.5, 0, 0.5, 0)}
						Image={UserInputService.GetImageForKeyCode(
							GAMEPAD_BUTTONS.CONFIRM_RESET
						)}
						AnchorPoint={UIDIM.A_CENTER}
						Position={UIDIM.TOP_RIGHT.add(new UDim2(0.1, 0, -0.15, 0))}
						Color3={new Color3(0.36, 0.66, 1)}
						Transparency={0.1}
					/>
				)}
			</RottenButton>
			<RottenButton
				onDown={(val) => val && mutateRevive()}
				Color={new Color3(0.09, 0.86, 0.09)}
				Size={UIDIM.ONE.add(UDim2.fromScale(0.5, 0.5))}
				Text="REVIVE"
				Ratio={1.5}
			>
				{device === "Gamepad" && (
					<Icon
						Size={new UDim2(0.5, 0, 0.5, 0)}
						Image={UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.REVIVE)}
						AnchorPoint={UIDIM.A_CENTER}
						Position={UIDIM.TOP_RIGHT.add(new UDim2(0.1, 0, -0.15, 0))}
						Color3={new Color3(0.36, 0.66, 1)}
						Transparency={0.1}
					/>
				)}
			</RottenButton>
		</imagelabel>
	)
}
