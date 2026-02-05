import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { Players } from "@rbxts/services"
import { Logger } from "shared/logger"
import { ICart } from "shared/type.helper"

@Component({ tag: "CartComponent" })
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
		const visuals = this.instance.FindFirstChild("Visuals") as Model
		// cart physics and stuff
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart") && descendant.Name !== "Mass") {
				descendant.Massless = true
				if (descendant.IsDescendantOf(visuals)) {
					descendant.CanCollide = false
				}
			}
		})
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
	}
	setOwnership(owner?: Player): void {
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.SetNetworkOwner(owner ?? undefined)
			}
		})
	}
}
