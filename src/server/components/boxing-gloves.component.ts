import { Players } from "@rbxts/services"
import type { Trove } from "@rbxts/trove"
import { Dependency } from "@typetorch/framework"
import { CartTouch } from "shared/components/cart-touch.component"
import { network } from "shared/net"
import { ICart } from "shared/type.helper"
import { BuildWeldConstraints, MasslessPart, TweenValue } from "shared/common/util.helper"
import { homePivot, rigOnce } from "shared/component"
import type { CartService } from "server/services/cart.service"

/** Tag "BoxingGlovesComponent" (Model): a glove that punches out every few seconds and knocks carts away. */
export class BoxingGlovesComponent extends CartTouch<Model> {
	private readonly debounce_cooldown = 0.2
	private debounce_map = new Map<Model, number>()

	constructor(instance: Model, trove: Trove) {
		super(instance, trove)
		// The welded rig is handed over between generations (only the punch loop is per generation).
		rigOnce(this.instance, "boxing", () => {
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
		})
		const root = this.instance.FindFirstChild("Root") as BasePart
		const cached_pivot = homePivot(root, "boxing")
		root.CFrame = cached_pivot
		let tween: Tween | undefined
		this.trove.add(() => tween?.Cancel())
		this.trove.add(task.spawn(() => {
				while (this.instance) {
					tween = TweenValue(
						new TweenInfo(0.5, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out),
						(alpha) => {
							const punch_offset = 50 * alpha
							root.CFrame = cached_pivot.mul(new CFrame(-punch_offset, 0, 0))
						}
					)
					tween.Completed.Wait()
					task.wait(3)
					tween = TweenValue(
						new TweenInfo(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
						(alpha) => {
							const punch_offset = 50 * (1 - alpha)
							root.CFrame = cached_pivot.mul(new CFrame(-punch_offset, 0, 0))
						}
					)
					tween.Completed.Wait()
					task.wait(5)
				}
			})
		)
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

		const seat = cart_model.FindFirstChildOfClass("VehicleSeat")
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
		network.server.CartService.boxingGlovePunch.fire(player, touch_position)
	}
}
