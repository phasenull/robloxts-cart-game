import { Component, Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import { RunService } from "@rbxts/services"
import { t } from "@rbxts/t"
import type { RobotArmComponent } from "server/components/robot-arm.component"
import type { CartService } from "server/services/cart.service"
import { ServerEvents } from "shared/network.helper"
import { ICart } from "shared/type.helper"
import { PlatformComponent } from "./platform.component"
import { Logger } from "shared/logger";

@Component({
	tag: "ElevatorPlatformComponent",
	instanceGuard: t.instanceIsA("BasePart"),
})
export class ElevatorPlatformComponent extends PlatformComponent {
	private currentCart: ICart | undefined
	constructor(private logger: Logger) {
		super()
		logger.log("ElevatorPlatformComponent initialized")
	}
	override onEnter(): void {
		if (!this.currentCart) return

		const robotArmModel = this.instance.FindFirstChild("RobotArm") as Model | undefined
		if (!robotArmModel) return

		const robotArm = Dependency<Components>().getComponent<RobotArmComponent>(robotArmModel)
		if (!robotArm) return

		robotArm.pickAndPlace(this.currentCart)
	}

	override onLeave(): void {
		this.currentCart = undefined
	}

	protected override setupServerListeners(): void {
		ServerEvents.PlatformService.onEnter.connect((player, platform) => {
			if (platform !== this.instance) return
			const cart = Dependency<CartService>().getPlayerCart(player)
			this.currentCart = cart
		})
		super.setupServerListeners()
	}
}
