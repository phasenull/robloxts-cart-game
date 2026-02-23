import { Component, Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import { RunService } from "@rbxts/services"
import { t } from "@rbxts/t"
import type { RobotArmComponent } from "server/components/robot-arm.component"
import type { CartService } from "server/services/cart.service"
import { ServerEvents } from "shared/network.helper"
import { Logger } from "shared/logger"
import { ICart } from "shared/type.helper"
import { PlatformComponent } from "./platform.component"

@Component({
	tag: "ElevatorPlatformComponent",
	instanceGuard: t.instanceIsA("BasePart"),
})
export class ElevatorPlatformComponent extends PlatformComponent {
	private currentCart: ICart | undefined
	private pickLoop: RBXScriptConnection | undefined

	constructor(private logger: Logger) {
		super()
		logger.log("ElevatorPlatformComponent initialized")
	}

	override onEnter(): void {
		this.logger.log(`[ElevatorPlatform] onEnter fired on ${this.instance.Name}`)
		this.startPickLoop()
	}

	override onLeave(): void {
		this.logger.log(`[ElevatorPlatform] onLeave fired on ${this.instance.Name}`)
		this.currentCart = undefined
		this.pickLoop?.Disconnect()
		this.pickLoop = undefined
	}

	destroy(): void {
		this.pickLoop?.Disconnect()
		super.destroy()
	}

	private getRobotArm(): RobotArmComponent | undefined {
		const robotArmModel = this.instance.FindFirstChild("RobotArm") as Model | undefined
		if (!robotArmModel) {
			this.logger.log("[ElevatorPlatform] no RobotArm child found on instance")
			return undefined
		}
		const robotArm = Dependency<Components>().getComponent<RobotArmComponent>(robotArmModel)
		if (!robotArm) {
			this.logger.log("[ElevatorPlatform] RobotArmComponent not found on RobotArm model (is it tagged?)")
		}
		return robotArm
	}

	private startPickLoop(): void {
		if (this.pickLoop) return
		this.pickLoop = RunService.Heartbeat.Connect(() => {
			if (!this.currentCart) return
			const robotArm = this.getRobotArm()
			if (!robotArm) return
			robotArm.pickAndPlace(this.currentCart)
		})
	}

	protected override setupServerListeners(): void {
		this.logger.log(`[ElevatorPlatform] setupServerListeners called for ${this.instance.Name}`)
		ServerEvents.PlatformService.onEnter.connect((player, platform) => {
			if (platform !== this.instance) return
			this.logger.log(`[ElevatorPlatform] network onEnter received for player ${player.Name}`)
			const cart = Dependency<CartService>().getPlayerCart(player)
			if (!cart) {
				this.logger.log(`[ElevatorPlatform] getPlayerCart returned undefined for ${player.Name}`)
			}
			this.currentCart = cart
		})
		super.setupServerListeners()
	}
}
