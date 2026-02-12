import React, { useEffect } from "@rbxts/react"

import useAnimateValue from "../../hooks/useAnimateValue"
import { UIDIM } from "client/ui/constants"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { useMutation } from "@rbxts/react-query"

import { A } from "shared/assets"
import { TweenService } from "@rbxts/services"
import { UIHelper } from "client/ui.helper"
import { useCart } from "client/ui/contexts/cart.context"

export function CartButtons(props: {
	__story?: {
		cart_enabled: boolean
		override_speed: number
		override_brake: boolean
		override_device: "Gamepad" | "Keyboard" | "Mobile"
	}
}) {
	const { cart, state, changeState, products } = useCart()
	const cartId = cart?.instance.Name ?? "no-cart"

	const { mutate: mutateBrake, data: is_braking_data } = useMutation({
		queryKey: ["brake", cartId],
		mutationFn: async (is_braking: boolean, force_value?: boolean) => {
			if (force_value !== undefined) {
				return force_value
			}
			if (!cart) return false
			if (is_braking) {
				const sound = UIHelper.playSound(A.sounds.drift)
				if (sound) {
					sound.PlaybackSpeed = 1.5
					sound.Volume = 0
					TweenService.Create(
						sound,
						new TweenInfo(
							0.5,
							Enum.EasingStyle.Linear,
							Enum.EasingDirection.InOut,
							0,
							true
						),
						{
							Volume: 1
						}
					).Play()
				}
			}
			cart.toggleBrake(is_braking)
			return is_braking
		}
	})

	const { mutate: mutateSwitchToResetScreen } = useMutation({
		mutationFn: async () => {
			if (!cart) return true
			UIHelper.toggleFade(true)
			task.wait(0.5)
			await cart.cleanupRide("reset by player")
			// Don't call changeState here - let CartController's death screen signal handle it
			task.wait(0.5)
			UIHelper.toggleFade(false)
			return true
		},
		queryKey: ["reset-character", cartId]
	})

	const { mutate: mutateHonk } = useMutation({
		queryKey: ["honk", cartId],
		mutationFn: async () => {
			if (!cart) return true
			cart.honk()
			UIHelper.playSound(A.sounds.mango_scream)
			return true
		}
	})

	const { mutate: mutateFlip } = useMutation({
		queryKey: ["flip", cartId],
		mutationFn: async () => {
			if (!cart) return false
			return await cart.promptFlip()
		}
	})

	const is_alive = !!cart?.instance || !!props.__story?.cart_enabled
	const IS_VISIBLE = is_alive

	const IS_BRAKING =
		props.__story?.override_brake ?? is_braking_data

	const brake_shake = useAnimateValue({
		target_value: IS_BRAKING ? 1 : 0,
		initial_value: 0,
		tween_info: new TweenInfo(
			0.1,
			Enum.EasingStyle.Sine,
			Enum.EasingDirection.InOut,
			-1,
			true
		),
		enabled: IS_BRAKING
	})
	useEffect(() => {
		if (!cart) {
			return
		}
		const brakeConnection = cart.brakeListener.Connect((status) => {
			mutateBrake(status, status)
		})
		return () => {
			brakeConnection.Disconnect()
		}
	}, [cart])
	const value = useAnimateValue({
		target_value: IS_VISIBLE ? 1 : 0,
		tween_info: new TweenInfo(
			0.7,
			Enum.EasingStyle.Quint,
			Enum.EasingDirection.InOut
		),
		enabled: true
	})
	return (
		<frame
			key={"bottom-hud"}
			AnchorPoint={UIDIM.A_BOTTOM}
			Position={new UDim2(0.5, 0, 1.3 - value * 0.4, 0)}
			// .add(new UDim2(0, 0, value, 0))
			BackgroundTransparency={1}
			Size={new UDim2(1, 0, 0.15, 0)}
		>
			<uiaspectratioconstraint AspectRatio={5} />
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
				onDown={(val) => val && mutateHonk()}
				action="HONK"
				overrideDevice={props.__story?.override_device}
			/>
			<frame
				Size={UIDIM.ONE}
				AnchorPoint={UIDIM.A_CENTER}
				BackgroundTransparency={1}
			>
				<uiaspectratioconstraint AspectRatio={2} />
				<RottenButton
					Rotation={IS_BRAKING ? (brake_shake - 0.5) * 5 : 0}
					Size={UIDIM.ONE}
					Ratio={2}
					Position={UIDIM.CENTER}
					AnchorPoint={UIDIM.A_CENTER}
					Text="BRAKE"
					Color={new Color3(1, 0.02, 0.02)}
					onDown={(is_down) => mutateBrake(is_down)}
					mockMouseDown={IS_BRAKING === true ? true : undefined}
					action="BRAKE"
					overrideDevice={props.__story?.override_device}
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
					Text={`FLIP ${products.get("flips") || 0}x`}
					onClick={() => mutateFlip()}
					Color={new Color3(0.11, 0.75, 0.95)}
					action="FLIP"
					overrideDevice={props.__story?.override_device}
				/>
				<RottenButton
					onClick={() => mutateSwitchToResetScreen()}
					Size={UIDIM.ONE}
					Ratio={2}
					Text="RESET"
					Color={new Color3(0.69, 0.02, 1)}
					action="RESET"
					overrideDevice={props.__story?.override_device}
				/>
			</frame>
		</frame>
	)
}
