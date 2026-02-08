import React, { useEffect } from "@rbxts/react"

import useAnimateValue from "../../hooks/useAnimateValue"
import { GAMEPAD_BUTTONS, UIDIM } from "client/ui/constants"
import { CartClientComponent } from "client/components/cart.client.component"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { useMutation } from "@rbxts/react-query"
import { __IS_STUDIO__ } from "shared/config.helper"

import { A } from "shared/assets"
import { Players, TweenService, UserInputService } from "@rbxts/services"
import { useInputType } from "client/ui/hooks/useInputType"
import { Icon } from "client/ui/components/icon"
import { useInput } from "client/ui/hooks/useInput"
import { UIHelper } from "client/ui.helper"
import { CartState } from "client/ui/contexts/cart.context"

export function CartButtons(props: {
	__story?: {
		cart_enabled: boolean
		override_speed: number
		override_brake: boolean
		override_device: "Gamepad" | "Keyboard" | "Mobile"
	}
	cart: CartClientComponent | undefined
	state: CartState
}) {
	const { cart } = props
	const device = props.__story?.override_device ?? useInputType()
	const brake_icon = UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.BRAKE)
	const honk_icon = UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.HONK)
	const flip_icon = UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.FLIP)
	const reset_icon = UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.RESET)

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

	const is_braking = props.__story?.override_brake ?? is_braking_data ?? false
	const { mutate: mutateReset } = useMutation({
		mutationFn: async () => {
			if (!cart) return true
			cart.cleanupRide("reset by player")
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
			if (!cart) return true
			cart.flipCart()
			return true
		}
	})

	const is_showing = !!(cart || props.__story?.cart_enabled)
	const is_alive = props.state === "alive" || !!props.__story?.cart_enabled

	const is_brake_down = useInput({
		key: GAMEPAD_BUTTONS.BRAKE,
		handler: (value) => mutateBrake(value),
		enabled: is_showing && is_alive
	})

	const is_honk_down = useInput({
		key: GAMEPAD_BUTTONS.HONK,
		handler: (value) => value && mutateHonk(),
		enabled: is_showing && is_alive
	})

	const is_flip_down = useInput({
		key: GAMEPAD_BUTTONS.FLIP,
		handler: (value) => value && mutateFlip(),
		enabled: is_showing && is_alive
	})

	const is_reset_down = useInput({
		key: GAMEPAD_BUTTONS.RESET,
		handler: (value) => value && mutateReset(),
		enabled: is_showing && is_alive
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
		target_value: is_showing ? 1 : 0,
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
				onDown={(val) => val && mutateHonk()}
				mockMouseDown={is_honk_down}
			>
				{device === "Gamepad" && (
					<Icon
						Size={new UDim2(0.5, 0, 0.5, 0)}
						Image={honk_icon}
						AnchorPoint={UIDIM.A_CENTER}
						Position={UIDIM.TOP_RIGHT.add(new UDim2(0.1, 0, -0.15, 0))}
						Color3={new Color3(0.36, 0.66, 1)}
						Transparency={0.1}
					/>
				)}
			</RottenButton>
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
					onDown={(is_down) => mutateBrake(is_down)}
					mockMouseDown={is_brake_down}
				>
					{device === "Gamepad" && (
						<Icon
							Size={new UDim2(0.5, 0, 0.5, 0)}
							Image={brake_icon}
							AnchorPoint={UIDIM.A_CENTER}
							Position={UIDIM.TOP_RIGHT.add(new UDim2(0.1, 0, -0.15, 0))}
							Color3={new Color3(0.36, 0.66, 1)}
							Transparency={0.1}
						/>
					)}
				</RottenButton>
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
					onDown={(val) => val && mutateFlip()}
					Color={new Color3(0.11, 0.75, 0.95)}
					mockMouseDown={is_flip_down}
				>
					{device === "Gamepad" && (
						<Icon
							Size={new UDim2(0.8, 0, 0.8, 0)}
							Image={flip_icon}
							AnchorPoint={UIDIM.A_LEFT}
							Position={UIDIM.RIGHT.add(new UDim2(0.1, 0, 0, 0))}
							Color3={new Color3(0.36, 0.66, 1)}
							Transparency={0.1}
						/>
					)}
				</RottenButton>
				<RottenButton
					onDown={(val) => val && mutateReset()}
					Size={UIDIM.ONE}
					Ratio={2}
					Text="RESET"
					Color={new Color3(0.69, 0.02, 1)}
					mockMouseDown={is_reset_down}
				>
					{device === "Gamepad" && (
						<Icon
							Size={new UDim2(0.8, 0, 0.8, 0)}
							Image={reset_icon}
							AnchorPoint={UIDIM.A_LEFT}
							Position={UIDIM.RIGHT.add(new UDim2(0.1, 0, 0, 0))}
							Color3={new Color3(0.36, 0.66, 1)}
							Transparency={0.1}
						/>
					)}
				</RottenButton>
			</frame>
		</frame>
	)
}
