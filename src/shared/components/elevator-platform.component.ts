import { Component, Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import { RunService } from "@rbxts/services"
import { t } from "@rbxts/t"
import type { RobotArmComponent } from "server/components/robot-arm.component"
import type { CartService } from "server/services/cart.service"
import { Logger } from "@common/shared/logger"
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
		this.currentCart = Dependency<CartService>().getPlayerCart(this.currentPlayer!)
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

	protected override validatePlayerNearPlatform(player: Player): boolean {
		const cart = Dependency<CartService>().getPlayerCart(player)
		print(`[ElevatorPlatform] validatePlayerNearPlatform override called, cart=${cart !== undefined}`)
		return cart !== undefined
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
			if (robotArm.pickAndPlace(this.currentCart)) {
				this.logger.log("[ElevatorPlatform] pickAndPlace accepted, stopping pick loop")
				this.currentCart = undefined
				this.pickLoop?.Disconnect()
				this.pickLoop = undefined
			}
		})
	}

}
