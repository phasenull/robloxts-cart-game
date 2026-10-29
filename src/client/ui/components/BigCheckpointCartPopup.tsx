import React, { useEffect, useRef, useState } from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { ConfirmationPopup } from "client/common/ui/components/confirmation-popup"
import { useCheckpoint } from "../gui/cart/hooks/useCheckpoint"
import { useNavigator } from "client/common/ui/hooks/useNavigator"
import { network } from "shared/net"
import { getCheckpointModelByIndex } from "shared/cart.helper"

export function BigCheckpointCartPopup() {
	const { currentCheckpoint } = useCheckpoint()
	const navigator = useNavigator()
	const [showPopup, setShowPopup] = useState(false)
	const shownForCheckpoint = useRef<number>(-1)
	const lastShownAt = useRef(-math.huge)
	const mountedAt = useRef(os.clock())

	const equippedCartName = useQuery({
		queryKey: ["player-preference", "cart"],
		queryFn: async () => {
			const [prefs] = await network.client.CustomizationService.getPlayerPreference.invoke("cart")
			if (!prefs) return "Cart"
			return prefs[0] ?? "Cart"
		},
	}).data ?? "Cart"

	useEffect(() => {
		if (currentCheckpoint === shownForCheckpoint.current) return
		if (equippedCartName !== "Cart") return

		const model = getCheckpointModelByIndex(currentCheckpoint)
		if (!model) return
		if (!model.FindFirstChild("Spawn")) return

		const now = os.clock()
		if (now - mountedAt.current < 10) return
		if (now - lastShownAt.current < 30) return

		shownForCheckpoint.current = currentCheckpoint
		lastShownAt.current = now
		setShowPopup(true)
	}, [currentCheckpoint, equippedCartName])

	return (
		<ConfirmationPopup
			visible={showPopup}
			title="New Island!"
			message="You reached a new island! Want to try a better cart?"
			confirmText="Sure!"
			cancelText="No"
			onConfirm={() => {
				setShowPopup(false)
				navigator.setOpenGui("carts")
			}}
			onCancel={() => {
				setShowPopup(false)
			}}
		/>
	)
}
