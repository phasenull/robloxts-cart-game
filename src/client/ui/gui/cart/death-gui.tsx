import React, { useEffect } from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { UIHelper } from "client/common/ui.helper"
import useAnimateValue from "client/common/ui/hooks/useAnimateValue"
import { useCart } from "client/ui/contexts/cart.context"
import { network } from "shared/net"
import { DeathButtons } from "./components/DeathButtons"
import { useDeathCamera } from "./hooks/useDeathCamera"
import { useDeathPreview } from "./hooks/useDeathPreview"

export function DeathGui() {
	const { spawnPoint, state, cart } = useCart()
	const shouldShow = state === "death_screen" || state === "reviving"

	const  {data, isPending}  = useDeathPreview()
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
	useEffect(() => {
		return () => {
			if (data) {
				// warn(`Cleaning up death preview cart: ${data}`)
				data.Destroy()
			}
		}
	}, [shouldShow,data])
	if (post_transparency === 1 && !shouldShow) {
		return undefined
	}

	return <DeathButtons transparency={post_transparency} isPreviewLoading={isPending} />
}
