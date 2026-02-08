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
export function CartButtons(props: {
	__story?: {
		cart_enabled: boolean
		override_speed: number
		override_brake: boolean
		override_device: "Gamepad" | "Keyboard" | "Mobile"
	}
	cart: CartClientComponent | undefined
}) {
	const { cart } = props
	const device = props.__story?.override_device ?? useInputType()
	const brake_icon = UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.BRAKE)
	const honk_icon = UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.HONK)
	const flip_icon = UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.FLIP)
	const reset_icon = UserInputService.GetImageForKeyCode(GAMEPAD_BUTTONS.RESET)
	const [braking, setBraking] = React.useState<boolean>(false)
	const is_braking = props.__story?.override_brake || braking

	const { mutate: mutateReset } = useMutation({
		mutationFn: async () => {
			if (!cart) {
				return true
			}
			cart.cleanupRide("reset by player")
			return true
		},
		queryKey: ["reset-character"]
	})
	const { mutate: mutateHonk } = useMutation({
		queryKey: ["honk", is_braking],
		mutationFn: async () => {
			if (cart) {
				cart.honk()
				UIHelper.playSound(A.sounds.mango_scream)
				return true
			}
			return true
		}
	})
	const { mutate: mutateFlip } = useMutation({
		queryKey: ["flip"],
		mutationFn: async () => {
			if (cart) {
				cart.flipCart()
				return true
			}
			return true
		}
	})
	const is_showing = !!(cart || props.__story?.cart_enabled)
	useInput({key: GAMEPAD_BUTTONS.BRAKE, handler: (value) => setBraking(value), enabled: is_showing})
	const is_gamepad_honking = useInput({key:GAMEPAD_BUTTONS.HONK,enabled: is_showing})
	const is_gamepad_flipping = useInput({key:GAMEPAD_BUTTONS.FLIP, enabled: is_showing})
	const is_gamepad_resetting = useInput({key:GAMEPAD_BUTTONS.RESET, enabled: is_showing})
	useEffect(() => {
		if (!is_showing) {
			return
		}
		if (is_gamepad_honking) {
			mutateHonk()
			return
		}
		if (is_gamepad_flipping) {
			mutateFlip()
			return
		}
		if (is_gamepad_resetting) {
			mutateReset()
			return
		}
	}, [cart, is_gamepad_honking, is_gamepad_flipping,is_gamepad_resetting])

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
				mockMouseDown={is_gamepad_honking ? true : undefined}
				onDown={(val) => val && mutateHonk()}
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
					onDown={(is_down) => setBraking(is_down)}
					mockMouseDown={is_braking === true ? true : undefined}
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
					onClick={mutateFlip}
					mockMouseDown={is_gamepad_flipping ? true : undefined}
					Color={new Color3(0.11, 0.75, 0.95)}
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
					onClick={mutateReset}
					Size={UIDIM.ONE}
					Ratio={2}
					mockMouseDown={is_gamepad_resetting ? true : undefined}
					Text="RESET"
					Color={new Color3(0.69, 0.02, 1)}
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
