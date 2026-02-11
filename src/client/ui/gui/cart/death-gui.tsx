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
	const { spawnPoint, state,cart } = useCart()
	const shouldShow = state === "death_screen" || state === "reviving"

	useDeathPreview({ spawnPoint, shouldShow })
	useDeathCamera({ spawnPoint, shouldShow })



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
		/>
	)
}
