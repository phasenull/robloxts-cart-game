import React, { useEffect } from "@rbxts/react"

import useAnimateValue from "../../hooks/useAnimateValue"
import { UIDIM } from "client/ui/constants"
import { CartClientComponent } from "client/components/cart.client.component"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { useMutation } from "@rbxts/react-query"
import { __IS_STUDIO__ } from "shared/config.helper"
import { UIHelper } from "shared/ui.helper"
import { A } from "shared/assets"
import { Players, TweenService } from "@rbxts/services"
export function CartButtons(props: {
	__story?: {
		cart_enabled: boolean
		override_speed: number
		override_brake: boolean
	}
	cart: CartClientComponent | undefined
}) {
	const { cart } = props

	const [braking, setBraking] = React.useState<boolean>(false)
	const is_braking = props.__story?.override_brake || braking
	const {mutate:resetChar}= useMutation({
		mutationFn: async () => {
			const player = Players.LocalPlayer
			const humanoid = player.Character?.FindFirstChildOfClass("Humanoid")
			if (humanoid) {
				humanoid.Health = 0
			}
			return true
		},
		queryKey:["reset-character"]
	})
	const { data, err, isLoading, mutate } = useMutation({
		queryKey: ["honk", is_braking],
		mutationFn: async () => {
			if (cart) {
				cart.honk()
				return true
			}
			if (__IS_STUDIO__) {
				UIHelper.playSound(A.sounds.mango_scream)
			}
			return true
		}
	})
	const brake_shake = useAnimateValue({
		target_value: is_braking ? 1 : 0,
		initial_value: 0,
		tween_info: new TweenInfo(
			0.1,
			Enum.EasingStyle.Sine,
			Enum.EasingDirection.InOut,
			-1,
			true
		),
		enabled: is_braking
	})
	useEffect(() => {
		if (braking) {
			const sound = UIHelper.playSound(A.sounds.drift)
			if (sound) {
				sound.PlaybackSpeed = 1.5
				sound.Volume = 0
				TweenService.Create(sound, new TweenInfo(.5, Enum.EasingStyle.Linear,Enum.EasingDirection.InOut,0,true), {
					Volume: 1
				}).Play()
			}
		}
		if (!cart) {
			return
		}
		cart.toggleBrake(braking)
		return
		
	}, [cart, braking])
	useEffect(() => {
		if (!cart) {
			return
		}
		const brakeConnection = cart.brakeListener.Connect((status) => {
			setBraking(status)
		})
		return () => {
			brakeConnection.Disconnect()
		}
	}, [cart])
	const value = useAnimateValue({
		target_value: cart || props.__story?.cart_enabled ? 1 : 0,
		tween_info: new TweenInfo(
			0.7,
			Enum.EasingStyle.Quint,
			Enum.EasingDirection.InOut
		),
		enabled: true
	})
	if (value === 0) return undefined
	return (
		<frame
			key={"bottom-hud"}
			AnchorPoint={UIDIM.A_BOTTOM}
			Position={new UDim2(0.5, 0, 1.3 - value * 0.4, 0)}
			// .add(new UDim2(0, 0, value, 0))
			BackgroundTransparency={1}
			Size={new UDim2(1, 0, 0.15, 0)}
		>
			<uiscale Scale={1.3 - value * 0.3} />
			<uilistlayout
				ItemLineAlignment={Enum.ItemLineAlignment.Center}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				FillDirection={Enum.FillDirection.Horizontal}
				Padding={new UDim(0.05, 0)}
			/>
			<RottenButton
				Size={UIDIM.ONE}
				Ratio={1.2}
				Text="HONK"
				Color={new Color3(0.95, 0.86, 0.11)}
				onDown={(val)=>val && mutate()}
			/>
			<frame
				Size={UIDIM.ONE}
				AnchorPoint={UIDIM.A_CENTER}
				BackgroundTransparency={1}
			>
				<uiaspectratioconstraint AspectRatio={2} />
				<RottenButton
					Rotation={is_braking ? (brake_shake - 0.5) * 5 : 0}
					Size={UIDIM.ONE}
					Ratio={2}
					Position={UIDIM.CENTER}
					AnchorPoint={UIDIM.A_CENTER}
					Text="BRAKE"
					Color={new Color3(1, 0.02, 0.02)}
					onDown={(is_down) => setBraking(is_down)}
					mockMouseDown={is_braking === true ? true : undefined}
				/>
			</frame>
			<frame BackgroundTransparency={1} Size={UIDIM.ONE}>
				<uiaspectratioconstraint AspectRatio={0.8} />
				<uilistlayout
					ItemLineAlignment={Enum.ItemLineAlignment.Center}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0.2, 0)}
				/>
				<RottenButton
					Size={UIDIM.ONE}
					Ratio={2}
					Text="FLIP"
					Color={new Color3(0.11, 0.75, 0.95)}
				/>
				<RottenButton
					onClick={resetChar}
					Size={UIDIM.ONE}
					Ratio={2}
					Text="RESET"
					Color={new Color3(0.69, 0.02, 1)}
				/>
			</frame>
		</frame>
	)
}
