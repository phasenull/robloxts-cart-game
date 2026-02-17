import React, { useEffect, useMemo, useState } from "@rbxts/react"

import useAnimateValue from "../../hooks/useAnimateValue"
import { UIDIM } from "client/ui/constants"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { useMutation } from "@rbxts/react-query"

import { A } from "shared/assets"
import { TweenService } from "@rbxts/services"
import { UIHelper } from "client/ui.helper"
import { useCart } from "client/ui/contexts/cart.context"
import { useInputType } from "client/ui/hooks/useInputType"

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
	const device = props.__story?.override_device ?? useInputType()
	const isMobile = device === "Mobile"

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

	const IS_BRAKING = props.__story?.override_brake ?? is_braking_data

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

	// Check if cart should shake flip button
	const stuck_at = cart?.getStuckAt()
	const speed = cart?.getSpeed() ?? 0
	const should_shake_flip =
		stuck_at !== undefined && tick() - stuck_at > 3 && speed < 2

	const flip_shake = useAnimateValue({
		target_value: should_shake_flip ? 1 : 0,
		initial_value: 0,
		tween_info: new TweenInfo(
			0.15,
			Enum.EasingStyle.Sine,
			Enum.EasingDirection.InOut,
			-1,
			true
		),
		enabled: should_shake_flip
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
			AnchorPoint={isMobile ? UIDIM.A_BOTTOM_RIGHT : UIDIM.A_BOTTOM}
			Position={
				isMobile
					? new UDim2(1, -20, 0.9, 0)
					: new UDim2(0.5, 0, 1.3 - value * 0.4, 0)
			}
			// .add(new UDim2(0, 0, value, 0))
			BackgroundTransparency={1}
			ClipsDescendants={false}
			Size={new UDim2(0.5, 0, isMobile ? 0.4 : 0.15, 0)}
		>
			<uiaspectratioconstraint AspectRatio={isMobile ? 1 : 5} />
			<uiscale Scale={isMobile ? 1.3 * value : 1.3 - value * 0.3} />
			<uilistlayout
				ItemLineAlignment={
					isMobile ? Enum.ItemLineAlignment.End : Enum.ItemLineAlignment.Center
				}
				HorizontalAlignment={
					isMobile
						? Enum.HorizontalAlignment.Right
						: Enum.HorizontalAlignment.Center
				}
				VerticalAlignment={
					isMobile
						? Enum.VerticalAlignment.Bottom
						: Enum.VerticalAlignment.Center
				}
				FillDirection={Enum.FillDirection.Horizontal}
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(isMobile ? 0.2 : 0.05, 0)}
			/>
			{isMobile ? undefined : (
				<HonkButton
					isMobile={isMobile}
					onDown={(val) => val && mutateHonk()}
					__story={props.__story}
				/>
			)}
			<frame
				Size={UIDIM.ONE}
				AnchorPoint={UIDIM.A_CENTER}
				BackgroundTransparency={1}
				LayoutOrder={isMobile ? 5 : 0}
				ClipsDescendants={false}
			>
				<uilistlayout
					Padding={new UDim(0.1, 0)}
					ItemLineAlignment={Enum.ItemLineAlignment.End}
					VerticalAlignment={Enum.VerticalAlignment.Bottom}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
				/>
				<uiaspectratioconstraint AspectRatio={isMobile ? 0.5 : 2} />
				{isMobile ? (
					<HonkButton
						isMobile={isMobile}
						onDown={(val) => val && mutateHonk()}
						__story={props.__story}
					/>
				) : undefined}
				<frame
					BackgroundTransparency={1}
					Size={isMobile ? UDim2.fromScale(1, 2) : UIDIM.ONE}
					Position={UIDIM.CENTER}
					AnchorPoint={UIDIM.A_CENTER}
				>
					<uiaspectratioconstraint AspectRatio={isMobile ? 0.7 : 2} />
					<RottenButton
						Rotation={IS_BRAKING ? (brake_shake - 0.5) * 5 : 0}
						Size={isMobile ? UDim2.fromScale(1, 2) : UIDIM.ONE}
						Ratio={isMobile ? 0.7 : 2}
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
			</frame>
			<frame
				BackgroundTransparency={1}
				Size={isMobile ? UIDIM.CENTER : UIDIM.ONE}
			>
				<uiaspectratioconstraint AspectRatio={0.8} />
				<uilistlayout
					ItemLineAlignment={Enum.ItemLineAlignment.Center}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					FillDirection={Enum.FillDirection.Vertical}
					Padding={new UDim(0.2, 0)}
				/>
				<frame
					BackgroundTransparency={1}
					Size={UIDIM.ONE}
					Position={UIDIM.CENTER}
					AnchorPoint={UIDIM.A_CENTER}
				>
					<uiaspectratioconstraint AspectRatio={2} />
					<RottenButton
						Size={UIDIM.ONE}
						Ratio={2}
						Text={`FLIP ${products.get("flips") || 0}x`}
						onClick={() => mutateFlip()}
						Color={new Color3(0.11, 0.75, 0.95)}
						action="FLIP"
						overrideDevice={props.__story?.override_device}
						Rotation={should_shake_flip ? (flip_shake - 0.5) * 10 : 0}
						Position={UIDIM.CENTER.add(new UDim2(0, 0, should_shake_flip ? -0.1 : 0, 0))}
						AnchorPoint={UIDIM.A_CENTER}
					/>
				</frame>
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

function HonkButton(props: {
	isMobile: boolean
	onDown: (is_down: boolean) => void
	__story?: {
		override_device: "Gamepad" | "Keyboard" | "Mobile"
	}
}) {
	return (
		<RottenButton
			Size={props.isMobile ? UIDIM.CENTER : UIDIM.ONE}
			Ratio={props.isMobile ? 1 : 1.2}
			Text="HONK"
			Color={new Color3(0.95, 0.86, 0.11)}
			onDown={(val) => val && props.onDown(true)}
			action="HONK"
			overrideDevice={props.__story?.override_device}
		/>
	)
}
