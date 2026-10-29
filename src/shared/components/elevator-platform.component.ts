import { RunService } from "@rbxts/services"
import type { Trove } from "@rbxts/trove"
import { Dependency } from "@typetorch/framework"
import type { RobotArmComponent } from "server/components/robot-arm.component"
import type { CartService } from "server/services/cart.service"
import type { ComponentsService } from "server/services/components.service"
import { Logger } from "shared/common/logger"
import { ICart } from "shared/type.helper"
import { PlatformComponent } from "./platform.component"

/** Tag "ElevatorPlatformComponent" (any BasePart): hands the rider's cart to the platform's robot arm. */
export class ElevatorPlatformComponent extends PlatformComponent {
	private readonly logger = new Logger("elevatorplatform.component")
	private currentCart: ICart | undefined
	private pickLoop: RBXScriptConnection | undefined

	constructor(instance: BasePart, trove: Trove) {
		super(instance, trove)
		this.trove.add(() => this.pickLoop?.Disconnect())
		this.logger.log("ElevatorPlatformComponent initialized")
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
		const robotArm = Dependency<ComponentsService>().getRobotArm(robotArmModel)
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
