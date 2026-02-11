import { useEffect } from "@rbxts/react"
import { Players, Workspace } from "@rbxts/services"
import { UIHelper } from "client/ui.helper"
import { useCart } from "client/ui/contexts/cart.context"
import { assets } from "shared/assets"
import { RigCartModel } from "shared/cart.helper"
import { ICart } from "shared/type.helper"

interface UseDeathPreviewProps {
	spawnPoint: CFrame | undefined
}

export function useDeathPreview({ spawnPoint }: UseDeathPreviewProps) {
	const cart = useCart().cart
	const player = Players.LocalPlayer
	// const char = player.Character
	// const pp = char?.PrimaryPart
	// if (char && pp) {
	// 	if (!cart && spawnPoint) {
	// 		pp.Anchored = true
	// 		pp.CFrame = spawnPoint.mul(new CFrame(0, -50, 0))
	// 	}
	// 	if (cart && spawnPoint) {
	// 		pp.Anchored = true
	// 		pp.CFrame = spawnPoint.mul(new CFrame(0, -50, 0))
	// 	}
	// 	if (cart && !spawnPoint) {
	// 		pp.Anchored = false
	// 		const humanoid = char.FindFirstChildOfClass("Humanoid")
	// 		if (humanoid) {
	// 			const is_sitting = humanoid.Sit
	// 			if (!is_sitting) {
	// 				pp.CFrame = cart.instance.GetPivot().mul(new CFrame(0, 0, 0))
	// 			}
	// 		}
	// 	}

	// }
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

		// Add highlight effect
		const highlight = new Instance("Highlight", example_cart)
		highlight.FillColor = Color3.fromRGB(41, 212, 255)
		highlight.OutlineColor = Color3.fromRGB(255, 255, 255)

		// Create humanoid model
		const local_player = Players.LocalPlayer
		let preview_char: Model | undefined = undefined
		try {
			preview_char = Players.CreateHumanoidModelFromUserIdAsync(
				local_player.UserId
			)
			preview_char.GetDescendants().forEach((desc) => {
				if (
					["LocalScript", "Script", "ModuleScript"].includes(desc.ClassName)
				) {
					// desc.Destroy()
				}
			})
			example_cart.GetDescendants().forEach((desc) => {
				if (desc.IsA("BasePart")) {
					desc.CanCollide = false
				}
			})
			const humanoid = preview_char.FindFirstChildOfClass("Humanoid")
			preview_char.PrimaryPart!.Anchored = true
			preview_char.Parent = example_cart
			humanoid?.ChangeState(Enum.HumanoidStateType.Physics)
			preview_char.GetDescendants().forEach((desc) => {
				if (desc.IsA("BasePart")) {
					desc.CanCollide = false
					desc.CollisionGroup = "Players"
				}
			})
			preview_char.PivotTo(example_cart.GetPivot())

			// Position player character off-screen

			// Play animation
			if (humanoid) {
				humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
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
		example_cart.Parent = Workspace.CurrentCamera

		return () => {
			example_cart.Destroy()
		}
	}, [spawnPoint])
}
