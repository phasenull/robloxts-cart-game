import { Dependency } from "@flamework/core"
import React, { useEffect } from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { UserInputService } from "@rbxts/services"
import { CartController } from "client/controllers/cart.controller"
import { UIHelper } from "client/ui.helper"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { GoofyText } from "client/ui/components/goofy-text"
import { Icon } from "client/ui/components/icon"
import { RadialProgress } from "client/ui/components/radial-progress"
import { GAMEPAD_BUTTONS, REVIVE_TIME, UIDIM } from "client/ui/constants"
import { useCart } from "client/ui/contexts/cart.context"
import { useInput } from "client/ui/hooks/useInput"
import { useInputType } from "client/ui/hooks/useInputType"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { ClientFunctions } from "shared/network.helper"
import { useCheckpoint } from "../hooks/useCheckpoint"

interface DeathButtonsProps {
	transparency: number
}

export function DeathButtons({
	// shouldShow,
	transparency
}: DeathButtonsProps) {
	const device = useInputType()
	const { changeState, confirmHardReset, spawnPoint, state, products } =
		useCart()
	const shouldShow = state === "death_screen" || state === "reviving"
	const checkpoint = useCheckpoint().currentCheckpoint
	const { mutate: mutateRevive } = useMutation({
		queryKey: ["death-revive"],
		mutationFn: async () => {
			const controller = Dependency<CartController>()
			const [result, err] = await controller.promptRevive(checkpoint)
			if (!result || err) {
				throw `${err}`
			}
			return result
		},
		onError: (err) => {
			warn(`Failed to revive player: ${err}`)
		}
	})

	const { mutate: mutateReset } = useMutation({
		queryKey: ["death-reset"],

		mutationFn: async () => {
			if (!spawnPoint) {
				warn("No spawn point set for death screen")
				return false
			}
			UIHelper.toggleFade(true)
			task.wait(0.5)
			changeState("none")
			confirmHardReset()
			UIHelper.toggleFade(false)
			if (__IS_EDIT__) return true
			try {
				await ClientFunctions.CartService.respawn.invokeWithTimeout(5000)
				return true
			} catch (err) {
				warn(`Failed to respawn player: ${err}`)

				return false
			}
		}
	})
	useEffect(() => {
		if (!shouldShow) {
			return
		}
		const job = task.delay(REVIVE_TIME, () => {
			if (shouldShow) {
				mutateReset()
			}
		})
		return () => {
			task.cancel(job)
		}
	}, [shouldShow])
	if (!shouldShow) {
		return
	}
	return (
		<imagelabel
			Size={UDim2.fromScale(0.2, 0.2)}
			AnchorPoint={UIDIM.A_BOTTOM}
			Position={UDim2.fromScale(0.5, 0.95 + 1 - transparency)}
			BackgroundTransparency={1}
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
				onClick={mutateReset}
				Text="RESET"
				bindKey={GAMEPAD_BUTTONS.CONFIRM_RESET}
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
				onClick={mutateRevive}
				Color={new Color3(0.09, 0.86, 0.09)}
				Size={UIDIM.ONE.add(UDim2.fromScale(0.5, 0.5))}
				Text={`REVIVE (${products.get("revives") || 0}x)`}
				Ratio={1.5}
				bindKey={GAMEPAD_BUTTONS.REVIVE}
			>
				<RadialProgress
					degrees_per_second={360 / REVIVE_TIME}
					progress={1}
					initial_progress={0}
					Color={new Color3(1, 0.36, 0.36)}
					Size={UDim2.fromScale(0.5, 0.5)}
					Position={UDim2.fromScale(0, 0)}
					AnchorPoint={UIDIM.A_CENTER}

					// initial_progress={1}
				/>
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
