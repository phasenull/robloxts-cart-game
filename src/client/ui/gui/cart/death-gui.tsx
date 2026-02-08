import { Dependency } from "@flamework/core"
import React, { Fragment, useEffect } from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { Players, Workspace } from "@rbxts/services"
import { CartController } from "client/controllers/cart.controller"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { GoofyText } from "client/ui/components/goofy-text"
import { UIDIM } from "client/ui/constants"
import useAnimateValue from "client/ui/hooks/useAnimateValue"
import { assets } from "shared/assets"
import { RigCartModel } from "shared/cart.helper"
import { __IS_EDIT__ } from "shared/config.helper"
import { ICart } from "shared/type.helper"

export function DeathGui() {
	const [spawnPoint, setSpawnPoint] = React.useState<CFrame | undefined>(
		undefined
	)
	const should_show = spawnPoint !== undefined
	React.useEffect(() => {
		if (__IS_EDIT__) {
			// setSpawnPoint(new CFrame(-34.11, 20.933, 0.999))
			return
		}
		const cart_controller = Dependency<CartController>()
		const connection = cart_controller.onDeath.Connect((spawn_point) => {
			setSpawnPoint(spawn_point)
		})
		return () => {
			connection.Disconnect()
		}
	}, [])

	const my_char = Players.LocalPlayer.Character
	if (my_char && my_char.PrimaryPart) {
		my_char.PrimaryPart.Anchored = !!spawnPoint
	}
	useEffect(() => {
		if (!spawnPoint) {
			return
		}
		const example_cart = assets.carts.FindFirstChild("Cart")?.Clone() as ICart
		if (!example_cart) {
			return
		}
		RigCartModel(example_cart)
		const seat = example_cart.FindFirstChildOfClass("Seat")
		if (!seat) {
			return
		}
		example_cart.PrimaryPart!.Anchored = true
		const highlight = new Instance("Highlight", example_cart)
		highlight.FillColor = Color3.fromRGB(41, 212, 255)
		highlight.OutlineColor = Color3.fromRGB(255, 255, 255)
		const local_player = Players.LocalPlayer
		let char: Model | undefined = undefined
		let job: thread | undefined = undefined
		try {
			char = Players.CreateHumanoidModelFromUserIdAsync(local_player.UserId)
			char.GetDescendants().forEach((desc) => {
				if (
					["LocalScript", "Script", "ModuleScript"].includes(desc.ClassName)
				) {
					// desc.Destroy()
				}
			})
			char.Parent = example_cart
			char.PivotTo(example_cart.GetPivot())
			const humanoid = char.FindFirstChildOfClass("Humanoid")
			char.PrimaryPart!.Anchored = true
			if (humanoid) {
				// humanoid.SetStateEnabled(Enum.HumanoidStateType.None, false)
				job = task.spawn(() => {
					while (task.wait(0.1) && !humanoid.Sit) {
						humanoid.ChangeState(Enum.HumanoidStateType.PlatformStanding)
						print(`Humanoid state: ${humanoid.GetState()}`)
						seat.Sit(humanoid)
					}
				})
				const animator = humanoid.FindFirstChildOfClass("Animator")
				const anim = new Instance("Animation", animator)
				anim.AnimationId = "rbxassetid://100765437584509"
				if (animator) {
					const track = animator.LoadAnimation(anim)
					track.Looped = true
					track.Play()
				}
			}
		} catch (err) {
			warn(`Failed to create humanoid model for death screen: ${err}`)
		}

		example_cart.PivotTo(spawnPoint)
		task.delay(transition_duration, () => {
			example_cart.Parent = Workspace.CurrentCamera
		})
		return () => {
			example_cart.Destroy()
			if (job) {
				task.cancel(job)
			}
		}
	}, [spawnPoint])
	const rotation = useAnimateValue({
		target_value: 1,
		tween_info: new TweenInfo(
			10,
			Enum.EasingStyle.Linear,
			Enum.EasingDirection.Out,
			-1
		),
		enabled: should_show
	})
	const distance = 16
	const target_cframe = spawnPoint
		? CFrame.lookAt(
				new CFrame(spawnPoint.Position)
					.mul(CFrame.Angles(0, math.rad(rotation * 360), 0))
					.mul(new CFrame(0, 5, -distance)).Position,
				spawnPoint.Position
			)
		: undefined
	const camera = Workspace.CurrentCamera
	if (camera) {
		if (target_cframe) {
			camera.CameraType = Enum.CameraType.Scriptable
			camera.CFrame = target_cframe
		} else {
			camera.CameraType = Enum.CameraType.Custom
		}
	}
	useEffect(() => {
		return () => {
			const camera = Workspace.CurrentCamera
			if (camera) {
				camera.CameraType = Enum.CameraType.Custom
			}
		}
	}, [spawnPoint])
	const transition_duration = 0.5
	const transparency = useAnimateValue({
		initial_value: 1,
		target_value: should_show ? 0 : 1,
		tween_info: new TweenInfo(
			transition_duration,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out,
			0,
			true,
			transition_duration
		)
	})
	const post_transparency = useAnimateValue({
		initial_value: 1,
		target_value: should_show ? 0 : 1,
		tween_info: new TweenInfo(
			transition_duration,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out,
			0,
			false,
			transition_duration
		)
	})
	return (
		<Fragment>
			<imagelabel
				Size={UDim2.fromScale(0.2, 0.2)}
				AnchorPoint={UIDIM.A_BOTTOM}
				Position={UDim2.fromScale(0.5, 0.95 + post_transparency)}
			>
				<uiaspectratioconstraint AspectRatio={4} />
				<uilistlayout
					Padding={new UDim(0.3, 0)}
					FillDirection={Enum.FillDirection.Horizontal}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					VerticalAlignment={Enum.VerticalAlignment.Center}
					SortOrder={Enum.SortOrder.LayoutOrder}
				/>
				<RottenButton
					Size={UIDIM.ONE}
					onClick={() => setSpawnPoint(undefined)}
					Text="RESET"
				>
					<GoofyText
						MinTextSize={1}
						Size={UDim2.fromScale(1, 0.3)}
						Position={UIDIM.BOTTOM_CENTER}
						AnchorPoint={UIDIM.A_TOP.add(new Vector2(0, 0.1))}
						Text={"(last checkpoint)"}
					></GoofyText>
				</RottenButton>
				<RottenButton
					Color={new Color3(0.09, 0.86, 0.09)}
					Size={UIDIM.ONE.add(UDim2.fromScale(0.5, 0.5))}
					Text="REVIVE"
					Ratio={1.5}
				/>
			</imagelabel>
			{/* fade in-out */}
			<frame
				Size={UDim2.fromScale(1, 1)}
				BackgroundTransparency={transparency}
				BackgroundColor3={new Color3(0, 0, 0)}
				BorderSizePixel={0}
			/>
		</Fragment>
	)
}
