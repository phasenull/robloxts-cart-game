import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { Players } from "@rbxts/services"
import { t } from "@rbxts/t"
import { RigCartModel } from "shared/cart.helper"
import { __IS_STUDIO__ } from "shared/config.helper"
import { Logger } from "shared/logger"
import { ICart, IWheel } from "shared/type.helper"

@Component({ tag: "CartComponent", instanceGuard: t.instanceOf("Model") })
export class CartServerComponent
	extends BaseComponent<{}, ICart>
	implements OnStart
{
	cleanup(): void {
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
			this.setOwnership(player)
			const char = player.Character
			char?.GetDescendants().forEach((descendant) => {
				if (descendant.IsA("BasePart")) {
					descendant.Massless = true
				}
			})
		})
	}
	constructor(private logger: Logger) {
		super()
		RigCartModel(this.instance)
	}
	setOwnership(owner?: Player): void {
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.SetNetworkOwner(owner ?? undefined)
			}
		})
	}
}
