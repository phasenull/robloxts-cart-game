import { Components } from "@flamework/components"
import { Controller, Dependency, OnStart } from "@flamework/core"
import { arrow } from "@rbxts/better-gizmos"
import { Players, Workspace } from "@rbxts/services"
import Signal from "@rbxts/signal"
import { ButtonComponent } from "client/components/button.component"
import { CartClientComponent } from "client/components/cart.client.component"
import { Logger } from "shared/logger"
import { ClientEvents } from "shared/network.helper"
import { ButtonModel } from "shared/type.helper"

@Controller({loadOrder: 5})
export class CartController implements OnStart {
	constructor(
		private logger: Logger
	) {}
	private __last_checkpoint: CFrame | undefined
	private arrow = arrow
	saveCheckpoint(cframe: CFrame) {
		this.__last_checkpoint = cframe
		const new_handle = this.arrow.draw(cframe.Position,cframe.Position.add(cframe.LookVector.mul(1)))
		task.delay(1.5, () => {
			if (this.__last_checkpoint === cframe) {
				return
			}
			new_handle.adornmentCone.Destroy()
			new_handle.adornmentLine.Destroy()
		})
	}
	public onDeath = new Signal<(spawn_point: CFrame|undefined) => void>()
	toggleDeathScreen(enabled: boolean) {
		if (enabled && this.__last_checkpoint) {
			this.onDeath.Fire(this.__last_checkpoint)
		} else {
			this.onDeath.Fire(undefined)
		}
	}
	onStart(): void {
		const components = Dependency<Components>()
		components.onComponentAdded<ButtonComponent>((component) => {
			const instance = component.instance
			if (!instance.IsDescendantOf(Workspace.FindFirstChild("CartSpawners")!)) {
				return
			}
			component.onPressed.Connect((player) => {
				if (player !== Players.LocalPlayer) return
				ClientEvents.CartService.spawnCart.fire(instance)
			})
		})
	}
}
