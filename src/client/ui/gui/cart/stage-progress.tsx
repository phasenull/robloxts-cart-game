import React, { useEffect, useRef, useState } from "@rbxts/react"
import { useCart } from "client/ui/contexts/cart.context"
import { useCheckpoint } from "./hooks/useCheckpoint"
import { Players, TweenService, Workspace } from "@rbxts/services"
import { ProgressBarComponent } from "client/ui/components/progressbar-component"
import { useRendering } from "client/ui/hooks/useRendering"
import { sphere } from "@rbxts/better-gizmos"
import { GoofyText } from "client/ui/components/goofy-text"
import { PRIMARY, UIDIM } from "client/ui/constants"
import {
	getCheckpointDataFromIndex,
	getCheckpointModelByIndex,
	getNextBigCheckpoint,
	getPreviousBigCheckpoint
} from "shared/cart.helper"
import { PlayerAvatar } from "client/ui/components/player-avatar"
export function StageProgress() {
	const { cart } = useCart()
	const { currentCheckpoint } = useCheckpoint()
	const tick = useRendering()

	const cart_position = (cart?.instance?.FindFirstChild("Root") as BasePart)
		?.Position
	const previous_checkpoint = useRef(
		getPreviousBigCheckpoint(currentCheckpoint)
	)
	const avatarRef = useRef<ImageLabel>()
	let override_progress = undefined as number | undefined
	useEffect(() => {
		// ace'in headshot animation önerisi
		if (!avatarRef.current) {
			return
		}
		if (
			previous_checkpoint.current !==
			getPreviousBigCheckpoint(currentCheckpoint)
		) {
			// level changed
			// print(
			// 	`Checkpoint changed, play animation! prev: ${previous_checkpoint.current}, new: ${getPreviousBigCheckpoint(currentCheckpoint)}`
			// )
			override_progress = 1
			const tween = TweenService.Create(
				avatarRef.current,
				new TweenInfo(
					0.5,
					Enum.EasingStyle.Sine,
					Enum.EasingDirection.In,
					0,
					true
				),
				{
					Size: UDim2.fromScale(3, 3),
					BackgroundColor3: Color3.fromRGB(135, 255, 135),
					// Position: UDim2.fromScale(0.5, 0.5)
					Position: UDim2.fromScale(1, 0.5)
				}
			)
			avatarRef.current.Position = UDim2.fromScale(1, 0.5)
			tween.Completed.Connect(() => {
				const second = TweenService.Create(
					avatarRef.current!,
					new TweenInfo(
						0.5,
						Enum.EasingStyle.Quint,
						Enum.EasingDirection.InOut
					),
					{
						Position: UDim2.fromScale(0, 0.5)
					}
				)
				second.Completed.Connect(() => {
					override_progress = undefined
				})
				second.Play()
			})
			tween.Play()
			previous_checkpoint.current = getPreviousBigCheckpoint(currentCheckpoint)
		}
	}, [currentCheckpoint, avatarRef.current])
	if (!cart_position) {
		return
	}
	const checkpoint = getCheckpointModelByIndex(
		getPreviousBigCheckpoint(currentCheckpoint)
	)
	if (!checkpoint) {
		return
	}
	const next_checkpoint = getCheckpointModelByIndex(
		getNextBigCheckpoint(currentCheckpoint)
	)
	if (!next_checkpoint) {
		return
	}
	const current_position = (
		(checkpoint.FindFirstChild("Trigger") ||
			checkpoint.FindFirstChild("Spawn")) as BasePart
	)?.Position
	const next_position = (
		(next_checkpoint.FindFirstChild("Trigger") ||
			next_checkpoint.FindFirstChild("Spawn")) as BasePart
	)?.Position
	const total_distance = next_position.sub(current_position).Magnitude
	const current_distance = math.clamp(
		cart_position.sub(next_position).Magnitude,
		0,
		total_distance
	)

	const new_progress =
		override_progress ?? 1 - math.clamp(current_distance / total_distance, 0, 1)
	if (next_checkpoint === checkpoint) {
		return
	}
	if (!cart) return
	return (
		<frame
			BackgroundTransparency={1}
			Position={new UDim2(0.5, 0, 0.05, 0)}
			AnchorPoint={UIDIM.A_TOP}
			Size={UIDIM.ONE}
		>
			<uiaspectratioconstraint AspectRatio={10} />
			<uilistlayout
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0.05, 0)}
				FillDirection={Enum.FillDirection.Vertical}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
			/>
			<ProgressBarComponent
				progress={new_progress}
				total_duration={0}
				Color={Color3.fromRGB(249, 65, 0)}
				Text={`${math.floor(new_progress * 100)}%`}
				AnchorPoint={new Vector2(0.5, 0)}
				Position={new UDim2(0.5, 0, 0.112, 0)}
				Size={new UDim2(0.15, 0, 0.15, 0)}
			>
				<PlayerAvatar
					ref={avatarRef}
					img_type={Enum.ThumbnailType.HeadShot}
					user_id={Players.LocalPlayer.UserId}
					AnchorPoint={UIDIM.A_CENTER}
					Position={UDim2.fromScale(new_progress, 0.5)}
					BackgroundTransparency={0}
					BackgroundColor3={PRIMARY}
					Size={UDim2.fromScale(2, 2)}
					BorderSizePixel={0}
				>
					<uicorner CornerRadius={new UDim(1, 0)} />
				</PlayerAvatar>
			</ProgressBarComponent>
			<GoofyText
				Size={UDim2.fromScale(0.3, 0.2)}
				Text={`${getCheckpointDataFromIndex(tonumber(checkpoint.Name) || 0)?.name}`}
			/>
		</frame>
	)
}
