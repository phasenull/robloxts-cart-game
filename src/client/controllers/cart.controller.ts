import { Components } from "@flamework/components"
import { Controller, Dependency, OnStart } from "@flamework/core"
import { Players, Workspace } from "@rbxts/services"
import { ButtonComponent } from "client/components/button.component"
import { Logger } from "shared/logger"
import { ClientEvents } from "shared/network.helper"
import { ButtonModel } from "shared/type.helper"

@Controller({loadOrder: 5})
export class CartController implements OnStart {
	private readonly spawners : Model[] = Workspace.FindFirstChild("CartSpawners")?.GetChildren() as Model[] || []
	constructor(
		private logger: Logger
	) {}
	onStart(): void {
		task.wait(3)
		const components = Dependency<Components>()
		this.logger.log(`Found ${this.spawners.size()} cart spawners`)
		this.spawners.forEach((_) => {
			const spawner = _ as ButtonModel
			const component = components.getComponent<ButtonComponent>(spawner)
			if (!component) {
				return
			}
			component.onPressed.Connect((player) => {
				this.logger.log(`Player ${player.Name} pressed cart spawner ${spawner.Name}`)
				if (player !== Players.LocalPlayer) return
				ClientEvents.CartService.spawnCart.fire(spawner)
			})
		})
	}
}
