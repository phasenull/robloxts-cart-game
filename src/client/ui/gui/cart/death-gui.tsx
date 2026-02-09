import React from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { UIHelper } from "client/ui.helper"
import useAnimateValue from "client/ui/hooks/useAnimateValue"
import { useCart } from "client/ui/contexts/cart.context"
import { ClientFunctions } from "shared/network.helper"
import { DeathButtons } from "./components/DeathButtons"
import { useDeathCamera } from "./hooks/useDeathCamera"
import { useDeathPreview } from "./hooks/useDeathPreview"

export function DeathGui() {
	const { spawnPoint, state, confirmHardReset: confirmReset, changeState } = useCart()
	const shouldShow = state === "death_screen" || state === "reviving"

	useDeathPreview({ spawnPoint })
	useDeathCamera({ spawnPoint, shouldShow })

	const { mutate: mutateHardReset, isLoading: isResetPending } = useMutation(
		{
			queryKey: ["confirm-reset"],
			mutationFn: async () => {
				if (!spawnPoint) {
					warn("No spawn point set for death screen")
					return false
				}
				changeState("none")
				UIHelper.toggleFade(true)
				task.wait(0.5)
				confirmReset()
				try {
					await ClientFunctions.CartService.respawn.invokeWithTimeout(5000)
					UIHelper.toggleFade(false)
					return true
				} catch (err) {
					warn(`Failed to respawn player: ${err}`)
					UIHelper.toggleFade(false)

					return false
				}
			}
		}
	)

	const { mutate: mutateRevive } = useMutation({
		queryKey: ["revive"],
		mutationFn: async () => {
			changeState("reviving")
			return true
		}
	})

	const transition_duration = 0.5
	const post_transparency = useAnimateValue({
		target_value: shouldShow ? 1 : 0,
		tween_info: new TweenInfo(
			transition_duration,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out
		)
	})

	if (post_transparency === 1 && !shouldShow) {
		return undefined
	}

	return (
		<DeathButtons
		
			transparency={post_transparency}
			onConfirmReset={() => mutateHardReset()}
			onRevive={() => mutateRevive()}
			isResetPending={isResetPending}
		/>
	)
}
