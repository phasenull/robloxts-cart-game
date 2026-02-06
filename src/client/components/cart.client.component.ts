import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { Players } from "@rbxts/services"
import Signal from "@rbxts/signal"
import StringUtils from "@rbxts/string-utils"
import { t } from "@rbxts/t"
import { AnimationController } from "client/controllers/animation.controller"
import { CartLisener } from "client/ui/gui/cart/cart-hud"
import { Logger } from "shared/logger"
import { ICart, IWheel } from "shared/type.helper"

@Component({
	tag: "CartComponent",
	instanceGuard: t.instanceOf("Model")
})
export class CartClientComponent
	extends BaseComponent<{}, ICart>
	implements OnPhysics, OnStart
{
	private rider: Humanoid | undefined
	resolvePlayer(): Player | undefined {
		const rider_character = this.rider?.Parent
		if (!rider_character) return undefined
		return Players.GetPlayerFromCharacter(rider_character)
	}
	private wheel_hitboxes: Part[] = []
	private power: number = 170
	private friction: number = 5
	private brake_friction: number = 30
	honk(): void {
		print("HOOOOG RAYDAAAAAĞĞĞĞ")
	}
	onPhysics(dt: number, time: number): void {
		const local_player = Players.LocalPlayer
		const character = local_player.Character
		if (!character) return
		const humanoid = character.FindFirstChildOfClass("Humanoid")
		if (!humanoid) return
		if (this.rider !== humanoid) {
			return
		}
		const force = this.instance.Root.VectorForce
		force.Force = humanoid.MoveDirection.mul(this.power)
		const direction = humanoid.MoveDirection.Unit
		if (direction.Magnitude > 0) {
			this.instance.Wheels.GetChildren().forEach((_) => {
				if (!_.IsA("Model")) return
				const model = _ as IWheel
				const wheel = model.WHEEL
				const connection = model.CONNECTION
				const lerped = model.CONNECTION.CFrame.Lerp(
					CFrame.fromMatrix(
						connection.Position,
						direction.mul(-1),
						Vector3.yAxis
					),
					math.clamp(dt, 0, 1)
				)
				connection.CFrame = lerped
			})
		}
		if (this.brake) {
			this.toggleBrake(true)
		} else {
			this.toggleBrake(false)
		}
	}
	constructor(
		private logger: Logger,
		private AnimationController: AnimationController
	) {
		super()
	}
	getPower(): number {
		return this.power
	}
	getFriction(): number {
		const wheel_constraints = this.instance
			.GetDescendants()
			.filter((descendant) =>
				descendant.IsA("BallSocketConstraint")
			) as BallSocketConstraint[]
		if (wheel_constraints.size() === 0) return 0
		return wheel_constraints[0].MaxFrictionTorque
	}
	setPower(new_power: number) {
		this.power = new_power
	}
	setFriction(new_friction: number) {
		if (new_friction > 5) {
			this.wheel_hitboxes.forEach((hitbox) => {
				hitbox.CustomPhysicalProperties = new PhysicalProperties(.7,2,.2)
			})
		} else {
			
			this.wheel_hitboxes.forEach((hitbox) => {
				hitbox.CustomPhysicalProperties = new PhysicalProperties(.7,.3,.2)
			})
		}
		const wheel_constraints = this.instance
			.GetDescendants()
			.filter((descendant) =>
				descendant.IsA("BallSocketConstraint")
			) as BallSocketConstraint[]
		for (const wheel_constraint of wheel_constraints) {
			wheel_constraint.MaxFrictionTorque = new_friction
		}
	}
	private brake = false
	private readonly cart_spawn_animation_id = 130142615868904
	private readonly cart_idle_animation_id = 100765437584509
	onRide(): void {
		const player = Players.LocalPlayer
		const character = player.Character
		const my_hunanoid = character?.FindFirstChildOfClass("Humanoid")
		if (my_hunanoid !== this.rider) {
			return
		}
		this.setFriction(this.friction)
		this.setPower(this.power)
		if (!this.rider) {
			return
		}
		this.AnimationController.stopAll()
		this.AnimationController.play({
			key: "cart_spawn",
			priority: Enum.AnimationPriority.Action2,
			speed: 0.7,
			animationId: this.cart_spawn_animation_id
		})
		this.AnimationController.play({
			key: "cart_idle",
			priority: Enum.AnimationPriority.Action2,
			speed: 1,
			animationId: this.cart_idle_animation_id,
			looped: true
		})
		this.rider.JumpHeight = 0
		const humanoid = this.rider
		const conn = this.rider.GetPropertyChangedSignal("Jump").Connect(() => {
			const value = humanoid.Jump
			if (!this.rider || this.rider !== humanoid) {
				conn.Disconnect()
				return
			}
			if (value) {
				this.toggleBrake(true)
			} else {
				this.toggleBrake(false)
			}
		})
		CartLisener.Fire(this)
	}
	toggleBrake(enable: boolean): void {
		if (this.instance.Root.AssemblyLinearVelocity.Magnitude > 1 && enable) {
			for (const brake of this.brakes) {
				brake.Enabled = true
			}
		} else {
			for (const brake of this.brakes) {
				brake.Enabled = false
			}
		}
		this.brakeListener.Fire(enable)
		this.setFriction(enable ? this.brake_friction : this.friction)
		this.brake = enable
	}
	cleanupRide(): void {
		this.logger.log("Cleaning up ride")
		this.setFriction(this.brake_friction)
		this.setPower(0)
		CartLisener.Fire(undefined)
		if (!this.rider) {
			return
		}
		this.rider.JumpHeight = 7.2
	}
	public readonly brakeListener = new Signal<(status: boolean) => void>()
	private readonly brakes: ParticleEmitter[] = []
	onStart(): void {
		const brake_original = this.instance.Brake
		this.instance.WaitForChild("Root", 10)?.Destroying.Once(() => {
			this.cleanupRide()
		})
		this.instance
			.Wheels.GetDescendants()
			.filter((child) => child.Name === "BALL")
			.forEach((child) => {
				if (child.IsA("BasePart")) {
					const brake = brake_original.Clone()
					brake.Parent = child
					brake.Enabled = false
					this.brakes.push(brake)
				}
			})
		this.instance.Wheels.GetChildren().forEach((_) => {
			if (!_.IsA("Model")) return
			const model = _ as IWheel
			this.wheel_hitboxes.push(model.BALL)
		})
		this.AnimationController.preload({
			key: "cart_spawn",
			animationId: this.cart_spawn_animation_id
		})
		this.AnimationController.preload({
			key: "cart_idle",
			animationId: this.cart_idle_animation_id
		})
		const seat = this.instance.VehicleSeat
		const player = Players.LocalPlayer
		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			const new_rider = seat.Occupant as Humanoid | undefined
			const char = player.Character
			const humanoid = char?.FindFirstChildOfClass("Humanoid")
			if (new_rider === undefined && this.rider === humanoid) {
				// local player just got off
				this.rider = undefined
				this.logger.log("!!!Local player got off the cart")
				this.cleanupRide()
				return
			}
			if (new_rider === humanoid) {
				// local player just got on
				this.rider = humanoid
				this.logger.log("!!!Local player got on the cart")
				this.onRide()
				return
			}
		})
	}
}
