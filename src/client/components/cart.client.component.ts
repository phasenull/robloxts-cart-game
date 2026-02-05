import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { Players } from "@rbxts/services"
import Signal from "@rbxts/signal"
import StringUtils from "@rbxts/string-utils"
import { CartLisener } from "client/ui/gui/cart/cart-hud"
import { Logger } from "shared/logger"
import { ICart } from "shared/type.helper"

@Component({ tag: "CartComponent" })
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
	private power: number = 120
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
		if (this.brake && this.instance.Root.AssemblyLinearVelocity.Magnitude > 1) {
			this.toggleBrake(true)
		} else {
			this.toggleBrake(false)
		}
	}
	constructor(private logger: Logger) {
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
	onRide(): void {
		this.setFriction(5)
		this.setPower(100)
		if (!this.rider) {
			return
		}
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
		for (const brake of this.brakes) {
			brake.Enabled = enable
		}
		this.brakeListener.Fire(enable)
		this.setFriction(enable ? 10 : 5)
		this.brake = enable
	}
	cleanupRide(): void {
		this.logger.log("Cleaning up ride")
		this.setFriction(0)
		this.setPower(0)
		CartLisener.Fire(undefined)
		if (!this.rider) {
			return
		}
		this.rider.JumpHeight = 7.2
	}
	public readonly brakeListener = new Signal<(status: boolean)=>void>()
	private readonly brakes: ParticleEmitter[] = []
	onStart(): void {
		const brake_original = this.instance.Brake
		this.instance.Root.Destroying.Once(() => {
			this.cleanupRide()
		})
		this.instance
			.GetChildren()
			.filter((child) => StringUtils.endsWith(child.Name, "_Ball"))
			.forEach((child) => {
				if (child.IsA("BasePart")) {
					const brake = brake_original.Clone()
					brake.Parent = child
					brake.Enabled = false
					this.brakes.push(brake)
				}
			})
		const seat = this.instance.VehicleSeat
		const player = Players.LocalPlayer
		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			const char = player.Character
			const humanoid = char?.FindFirstChildOfClass("Humanoid")
			if (seat.Occupant !== undefined && humanoid !== seat.Occupant) {
				return
			}
			this.rider = seat.Occupant as Humanoid | undefined
			this.logger.log(`Cart ridden by: ${this.rider?.Parent?.Name ?? "None"}`)
			if (this.rider) {
				this.onRide()
			} else {
				this.cleanupRide()
			}
		})
	}
}
