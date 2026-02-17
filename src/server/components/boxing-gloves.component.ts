import { Component } from "@flamework/components"
import { Dependency } from "@flamework/core"
import { Players } from "@rbxts/services"
import { CartTouch } from "shared/components/cart-touch.component"
import { ServerEvents } from "shared/network.helper"
import { ICart } from "shared/type.helper"
import {
	BuildWeldConstraints,
	MasslessPart,
	OutlineHighlight,
	TweenValue
} from "shared/util.helper"
import { CartService } from "server/services/cart.service"

@Component({
	tag: "BoxingGlovesComponent"
})
export class BoxingGlovesComponent extends CartTouch<Model> {
	private readonly debounce_cooldown = 0.2
	private debounce_map = new Map<Model, number>()

	constructor() {
		super()
		const root = MasslessPart(this.instance, "Root")
		root.CanCollide = false
		root.PivotTo(this.instance.GetPivot())
		root.Anchored = true
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant === root) {
				return
			}
			if (descendant.IsA("BasePart")) {
				descendant.CanCollide = false
				descendant.Massless = true
				descendant.Anchored = false
				descendant.CollisionGroup = "Spike"
				BuildWeldConstraints(root, descendant)
			}
		})
		const cached_pivot = root.GetPivot()
		this.thread = task.spawn(() => {
			while (this.instance) {
				const punch_tween = TweenValue(
					new TweenInfo(
						0.5,
						Enum.EasingStyle.Elastic,
						Enum.EasingDirection.Out
					),
					(alpha) => {
						const punch_offset = 50 * alpha
						root.CFrame = cached_pivot.mul(new CFrame(-punch_offset, 0, 0))
					}
				)
				punch_tween.Completed.Wait()
				task.wait(3)
				const return_tween = TweenValue(
					new TweenInfo(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
					(alpha) => {
						const punch_offset = 50 * (1 - alpha)
						root.CFrame = cached_pivot.mul(new CFrame(-punch_offset, 0, 0))
					}
				)
				return_tween.Completed.Wait()
				task.wait(5)
			}
		})
		const highlight = OutlineHighlight(this.instance)
	}
	private readonly thread: thread
	cleanup(): void {
		if (this.thread) {
			task.cancel(this.thread)
		}
		this.instance.Destroy()
	}
	onTouch(other_part: BasePart, cart_model: ICart): void {
		// Check shield protection
		const cart_service = Dependency<CartService>()
		if (cart_service.hasShield(cart_model)) {
			return
		}

		// Check debounce
		const now = tick()
		const last_hit = this.debounce_map.get(cart_model)
		if (last_hit !== undefined && now - last_hit < this.debounce_cooldown) {
			return
		}

		const seat = cart_model.FindFirstChildOfClass("Seat")
		if (!seat) {
			return
		}
		const occupant = seat.Occupant
		if (!occupant) {
			return
		}
		const player = Players.GetPlayerFromCharacter(occupant.Parent)
		if (!player) {
			return
		}

		// Update debounce
		this.debounce_map.set(cart_model, now)

		const touch_position = this.touch_part.Position
		ServerEvents.CartService.boxingGlovePunch.fire(player, touch_position)
	}
}
