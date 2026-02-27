import { BaseComponent, Component } from "@flamework/components"
import { Dependency,
OnPhysics, OnStart } from "@flamework/core"
import { Players } from "@rbxts/services"
import { t } from "@rbxts/t"
import { CartService } from "server/services/cart.service";
import { RigCartModel } from "shared/cart.helper"
import { Logger } from "@common/shared/logger"
import { ICart, IWheel } from "shared/type.helper"

@Component({ tag: "CartComponent", instanceGuard: t.instanceOf("Model") })
export class CartServerComponent
	extends BaseComponent<{}, ICart>
	implements OnStart
{
	private __is_cleaning_up = false
	private rider: Player | undefined
	cleanup(): void {
		if (this.__is_cleaning_up) {
			return
		}
		this.__is_cleaning_up = true
		this.setOwnership()
		this.logger.log(`Cleaning up cart: ${this.instance.GetFullName()}`)
		this.instance.Destroy()
		this.destroy()
	}
	onStart(): void {
		const seat = this.instance.VehicleSeat
		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			const player = Players.GetPlayerFromCharacter(
				seat.Occupant?.Parent as Model
			)
			if (!player) {
				this.cleanup()
				return
			}
			const seat_weld = seat.FindFirstChildOfClass("Weld")
			
			const char = player.Character
			if (seat_weld) {
				seat_weld.C0 = new CFrame(0, 0.6, 0)
				seat_weld.C1 = new CFrame(0, 0, 0)
			}
			this.setOwnership(player)
			this.rider = player
			char?.GetDescendants().forEach((descendant) => {
				if (descendant.IsA("BasePart")) {
					descendant.Massless = true
				}
			})
		})
	}
	resolvePlayer(): Player | undefined {
		return this.rider
	}
	constructor(private logger: Logger) {
		super()
		RigCartModel(this.instance)
		this.instance.Destroying.Once(() => {
			this.cleanup()
		})
	}
	setOwnership(owner?: Player): void {
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.SetNetworkOwner(owner ?? undefined)
			}
		})
	}
}
