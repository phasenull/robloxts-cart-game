import React, { useEffect, useState } from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { GoofyText } from "client/ui/components/goofy-text"
import { LoadingIndicator } from "client/ui/components/loading-indicator"
import { PRIMARY, UIDIM } from "client/ui/constants"
import { useCart } from "client/ui/contexts/cart.context"
import { useErrorPage } from "client/ui/contexts/error.context"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { A } from "shared/assets"

export function CartGui() {
	const { showError } = useErrorPage()
	const navigator = useNavigator()
	const { cart, state } = useCart()

	useEffect(() => {
		if (!cart && state === "none") {
			showError({
				message: "You are not currently in a cart.",
				title: "No Cart Found",
				onClose: () => {
					navigator.closeAll()
				}
			})
		}
	}, [cart, state])
	const {mutate} = useMutation({
		queryKey: "updateCartStats",
		mutationFn: async (params: { power?: number; friction?: number }) => {
			if (!cart) return true
			cart.overrideConfig({
				power: params.power ?? cart.getPower(),
				friction: params.friction ?? cart.getWheelFriction(),
				max_velocity: cart.getMaxVelocity()
			})
			return true
		}
	})
	const [friction, set_friction] = useState<number | undefined>()
	const [power, set_power] = useState<number | undefined>()
	useEffect(() => {
		mutate({ power, friction })
	}, [friction, power])
	
	const isLoading = state === "none" && !cart

	return (
		<imagelabel
			Size={UIDIM.ONE}
			AnchorPoint={UIDIM.A_CENTER}
			Position={UIDIM.CENTER}
			ScaleType={Enum.ScaleType.Crop}
			Image={A.ui.waves4}
			BackgroundColor3={PRIMARY}
			ImageTransparency={0.6}
		>
			{isLoading ? <LoadingIndicator /> : undefined}
			<uicorner CornerRadius={new UDim(0.1, 0)} />
			{cart ? (
				<frame Size={new UDim2(0.3, 0, 1, 0)} BackgroundTransparency={0.5}>
					<GoofyText
						Text={"my plot"}
						Size={new UDim2(1, 0, 1, 0)}
						Ratio={4}
					></GoofyText>
				</frame>
			) : undefined}
			<frame Size={UIDIM.HALF_X} BackgroundTransparency={1}>
				<uilistlayout />
				<GoofyText Text={"Set Power"} />
				<textbox
					Text={`${cart?.getPower()}`}
					Event={{
						InputEnded: (txt) => {
							set_power(tonumber(txt.Text || "0") || 0)
						}
					}}
					Size={new UDim2(1, 0, 0.3, 0)}
				></textbox>
				<GoofyText Text={"Set Friction"} />
				<textbox
					Text={`${cart?.getWheelFriction()}`}
					Event={{
						InputEnded: (txt) => {
							set_friction(tonumber(txt.Text || "0") || 0)
						}
					}}
					Size={new UDim2(1, 0, 0.3, 0)}
				></textbox>
			</frame>
		</imagelabel>
	)
}
