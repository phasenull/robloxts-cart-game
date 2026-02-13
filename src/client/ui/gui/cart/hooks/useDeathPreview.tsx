import { Dependency } from "@flamework/core"
import { useEffect, useState } from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { Players, Workspace } from "@rbxts/services"
import { CartController } from "client/controllers/cart.controller"
import { UIHelper } from "client/ui.helper"
import { useCart } from "client/ui/contexts/cart.context"
import { assets } from "shared/assets"
import { RigCartModel } from "shared/cart.helper"
import { ICart } from "shared/type.helper"
import { ClientEvents } from "shared/network.helper"
import { __IS_EDIT__ } from "shared/config.helper"

interface UseDeathPreviewProps {
	spawnPoint: CFrame | undefined
	shouldShow: boolean
}

export function useDeathPreview() {
	const { cart, spawnPoint, state } = useCart()
	const [previewModel, setPreviewModel] = useState<Model | undefined>(undefined)
	const should_show = state === "death_screen" && !cart
	
	// Cleanup preview when should_show becomes false or component unmounts
	useEffect(() => {
		if (!should_show && previewModel) {
			previewModel.Destroy()
			setPreviewModel(undefined)
		}
		return () => {
			if (previewModel) {
				previewModel.Destroy()
				setPreviewModel(undefined)
			}
		}
	}, [should_show, previewModel])
	
	// Listen for clear preview event from server
	useEffect(() => {
		if (__IS_EDIT__) return
		const connection = ClientEvents.CartService.clearDeathPreview.connect(() => {
			if (previewModel) {
				previewModel.Destroy()
				setPreviewModel(undefined)
			}
		})
		return () => connection.Disconnect()
	}, [previewModel])
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
	const { data, isLoading } = useQuery({
		queryKey: [`death-preview-cart::${spawnPoint}`],
		queryFn: async () => {
			const cart = buildPreviewCart(spawnPoint!)
			if (!cart) {throw `Failed to build preview cart for spawn point ${spawnPoint}`}
			// Only set preview model if we're still in death screen
			if (state === "death_screen" && !Dependency<CartController>().getMyCart()) {
				setPreviewModel(cart)
			} else {
				// Clean up immediately if we're no longer in death screen
				cart.Destroy()
			}
			return cart
		},
		enabled: should_show && spawnPoint !== undefined,
		onError: (err) => {
			warn(`Failed to create death preview cart: ${err}`)
		}
	})
	
	return { data, isLoading }
}
function buildPreviewCart(spawnPoint: CFrame) {
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
			if (["LocalScript", "Script", "ModuleScript"].includes(desc.ClassName)) {
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
	return example_cart
}
