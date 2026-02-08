import { Dependency } from "@flamework/core"
import React, { useEffect } from "@rbxts/react"
import { Players } from "@rbxts/services"
import { CartController } from "client/controllers/cart.controller"
import { __IS_EDIT__ } from "shared/config.helper"

export function useDeathScreen() {
	const [spawnPoint, setSpawnPoint] = React.useState<CFrame | undefined>(undefined)

	useEffect(() => {
		if (__IS_EDIT__) {
			// setSpawnPoint(new CFrame(-34.11, 20.933, 0.999))
			return
		}
		const cart_controller = Dependency<CartController>()
		const connection = cart_controller.toggleOnDeathScreen.Connect((spawn_point) => {
			setSpawnPoint(spawn_point)
		})
		return () => {
			connection.Disconnect()
		}
	}, [])

	// Anchor character when death screen is active
	useEffect(() => {
		const my_char = Players.LocalPlayer.Character
		if (my_char && my_char.PrimaryPart) {
			my_char.PrimaryPart.Anchored = !!spawnPoint
		}
	}, [spawnPoint])

	return {
		spawnPoint,
		setSpawnPoint,
		shouldShow: spawnPoint !== undefined
	}
}
