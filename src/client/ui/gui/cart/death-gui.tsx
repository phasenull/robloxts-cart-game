import React, { Fragment } from "@rbxts/react"
import { UIHelper } from "client/ui.helper"
import useAnimateValue from "client/ui/hooks/useAnimateValue"
import { ClientFunctions } from "shared/network.helper"
import { DeathButtons } from "./components/DeathButtons"
import { useDeathCamera } from "./hooks/useDeathCamera"
import { useDeathPreview } from "./hooks/useDeathPreview"
import { useDeathScreen } from "./hooks/useDeathScreen"

export function DeathGui() {
	const { spawnPoint, setSpawnPoint, shouldShow } = useDeathScreen()

	useDeathPreview({ spawnPoint })
	useDeathCamera({ spawnPoint, shouldShow })

	const handleConfirmReset = (spawnPoint: CFrame | undefined) => {
		print(`Confirming reset...: spawnPoint: ${spawnPoint}`)
		UIHelper.toggleFade(true)
		task.wait(0.5)
		ClientFunctions.CartService.respawn
			.invokeWithTimeout(5000)
			.then(() => {
				UIHelper.toggleFade(false)
				setSpawnPoint(undefined)
			})
			.catch((err) => {
				warn(`Failed to respawn player: ${err}`)
				UIHelper.toggleFade(false)
				setSpawnPoint(undefined)
			})
	}

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
		<Fragment>
			<DeathButtons
				spawnPoint={spawnPoint}
				shouldShow={shouldShow}
				transparency={post_transparency}
				onConfirmReset={handleConfirmReset}
			/>
		</Fragment>
	)
}
