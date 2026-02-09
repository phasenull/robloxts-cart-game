import { useEffect } from "@rbxts/react"
import { Players, Workspace } from "@rbxts/services"
import { assets } from "shared/assets"
import { RigCartModel } from "shared/cart.helper"
import { ICart } from "shared/type.helper"

interface UseDeathPreviewProps {
	spawnPoint: CFrame | undefined
}

export function useDeathPreview({ spawnPoint }: UseDeathPreviewProps) {
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
		let char: Model | undefined = undefined
		try {
			char = Players.CreateHumanoidModelFromUserIdAsync(local_player.UserId)
			char.GetDescendants().forEach((desc) => {
				if (["LocalScript", "Script", "ModuleScript"].includes(desc.ClassName)) {
					// desc.Destroy()
				}
			})
			char.Parent = example_cart
			char.PivotTo(example_cart.GetPivot())

			const humanoid = char.FindFirstChildOfClass("Humanoid")
			char.PrimaryPart!.Anchored = true

			// Position player character off-screen
			const my_char = Players.LocalPlayer.Character
			if (my_char && my_char.PrimaryPart) {
				my_char.PivotTo(spawnPoint.sub(new Vector3(0, 50, 0)))
			}

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
