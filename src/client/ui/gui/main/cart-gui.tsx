import { Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import React, { useEffect, useState } from "@rbxts/react"
import { useMutation, useQuery } from "@rbxts/react-query"
import { Players } from "@rbxts/services"
import { CartClientComponent } from "client/components/cart.client.component"
import { GoofyText } from "client/ui/components/goofy-text"
import { LoadingIndicator } from "client/ui/components/loading-indicator"
import { PRIMARY, UIDIM } from "client/ui/constants"
import { useErrorPage } from "client/ui/contexts/error.context"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { A } from "shared/assets"
import { __IS_EDIT__ } from "shared/config.helper"
export function CartGui() {
	const { showError } = useErrorPage()
	const navigator = useNavigator()
	const { data, err, isLoading, refetch } = useQuery({
		queryKey: "cartData",
		queryFn: async () => {
			let my_cart: CartClientComponent | undefined
			if (!__IS_EDIT__) {
				const components = Dependency<Components>()
				const all_carts = components.getAllComponents<CartClientComponent>()
				my_cart = all_carts.find(
					(cart) => cart.resolvePlayer() === Players.LocalPlayer
				)
			}
			if (!my_cart) {
				showError({
					message: "You are not currently in a cart.",
					title: "No Cart Found",
					onClose: () => {
						navigator.closeAll()
					}
				})
			}
			return my_cart
		}
	})
	const {mutate} = useMutation({
		queryKey: "updateCartStats",
		mutationFn: async (params: { power?: number; friction?: number }) => {
			if (!data) return true
			if (params.power !== undefined) {
				data.setPower(params.power)
			}
			if (params.friction !== undefined) {
				data.setFriction(params.friction)
			}
			return true
		}
	})
	const [friction, set_friction] = useState<number | undefined>()
	const [power, set_power] = useState<number | undefined>()
	useEffect(() => {
		mutate({ power, friction })
	}, [friction, power])
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
			{data ? (
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
					Text={`${data?.getPower()}`}
					Event={{
						InputEnded: (txt) => {
							set_power(tonumber(txt.Text || "0") || 0)
						}
					}}
					Size={new UDim2(1, 0, 0.3, 0)}
				></textbox>
				<GoofyText Text={"Set Friction"} />
				<textbox
					Text={`${data?.getFriction()}`}
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
