import { Components } from "@flamework/components"
import { Controller, Dependency, OnStart } from "@flamework/core"
import { Players, Workspace } from "@rbxts/services"
import { ButtonComponent } from "client/components/button.component"
import { Logger } from "shared/logger"
import { ClientEvents } from "shared/network.helper"
import { ButtonModel } from "shared/type.helper"

@Controller({loadOrder: 5})
export class CartController implements OnStart {
	constructor(
		private logger: Logger
	) {}
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
