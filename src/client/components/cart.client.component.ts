import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { sphere } from "@rbxts/better-gizmos"
import { Players, Workspace } from "@rbxts/services"
import Signal from "@rbxts/signal"
import StringUtils from "@rbxts/string-utils"
import { t } from "@rbxts/t"
import { AnimationController } from "client/controllers/animation.controller"
import { __STUDIO__ } from "client/ui/constants"
import { CartLisener } from "client/ui/gui/cart/cart-hud"
import { Logger } from "shared/logger"
import { ClientFunctions } from "shared/network.helper"
import { ICart, ICartEntry, IWheel } from "shared/type.helper"
import {
	calculateSteepDiffFromHumanoid,
	normalizeVector3
} from "shared/util.helper"

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
	private max_velocity = 25
	honk(): void {
		print("honk!")
	}
	public readonly brakeListener = new Signal<(status: boolean) => void>()
	private readonly brakes: ParticleEmitter[] = []
	private descriptor: string = "Cart"
	setDescriptor(new_descriptor: string): void {
		this.descriptor = new_descriptor
		this.logger.log(`Cart descriptor set to ${new_descriptor}`)
	}
	overrideConfig(args: {
		power: number
		friction: number
		max_velocity: number
	}): void {
		this.power = args.power
		this.wheel_friction = args.friction
		this.max_velocity = args.max_velocity
	}

	getMaxVelocity(): number {
		return this.max_velocity
	}
	getDescriptor(): string {
		return this.descriptor
	}
	getWheelFriction(): number {
		return this.wheel_friction
	}
	setWheelFriction(new_friction: number): void {
		this.wheel_hitboxes.forEach((hitbox) => {
			hitbox.CustomPhysicalProperties = new PhysicalProperties(
				0.7,
				new_friction,
				0.2
			)
		})
		this.wheel_friction = new_friction
	}
	private getSteepAngle() {
		const root = this.instance.Root
		const up_vector = new CFrame().UpVector.Dot(root.CFrame.UpVector)
		return math.acos(up_vector)
	}
	private getIsGrounded() {
		const steepness = this.getSteepAngle()
		return steepness > 0.5
	}
	private __steep_created_at = 0
	private is_steep = false
	toggleSteepState(enabled: boolean) {
		// check if 2 seconds have passed since last toggle
		if (enabled) {
			this.is_steep = true
			this.__steep_created_at = tick()
		} else {
			if (tick() - this.__steep_created_at > 2) {
				this.is_steep = false
			}
		}
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
		const velocity = this.instance.Root.AssemblyLinearVelocity
		const h = this.getHeight()
		const is_in_air = h > 5
		const max_velocity = this.max_velocity
		const is_going_down = velocity.Y < -10
		this.toggleSteepState(is_going_down && !is_in_air)
		if (velocity.Magnitude > max_velocity && !is_in_air) {
			if (this.is_steep) {
				if (velocity.Magnitude > max_velocity * 2) {
					this.instance.Root.AssemblyLinearVelocity = normalizeVector3(
						velocity,
						max_velocity * 3
					)
				}
			} else {
				this.instance.Root.AssemblyLinearVelocity = normalizeVector3(
					velocity,
					math.lerp(velocity.Magnitude, max_velocity, dt * 10)
				)
			}
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
				const align_orientation =
					connection.FindFirstChildOfClass("AlignOrientation")
				if (!align_orientation) return
				const lookat_pos = connection.Position.add(
					new Vector3(direction.X * 2, 0, direction.Z * 2)
				)
				// if (__STUDIO__) {
				const drawing = sphere.draw(lookat_pos, 0.3)
				task.delay(dt, () => {
					drawing.Destroy()
				})
				// }
				align_orientation.LookAtPosition = lookat_pos
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
		this.setDescriptor(this.instance.Name)
	}
	private wheel_friction = 2
	getPower(): number {
		return this.power
	}
	setPower(new_power: number) {
		this.power = new_power
	}

	toggleFriction(enabled: boolean) {
		if (enabled) {
			this.wheel_hitboxes.forEach((hitbox) => {
				const new_pp = new PhysicalProperties(1, this.wheel_friction, 0)
				hitbox.CustomPhysicalProperties = new_pp
			})
		} else {
			this.wheel_hitboxes.forEach((hitbox) => {
				hitbox.CustomPhysicalProperties = new PhysicalProperties(0.7, 0, 0.2)
			})
		}
		const wheel_constraints = this.instance
			.GetDescendants()
			.filter((descendant) =>
				descendant.IsA("BallSocketConstraint")
			) as BallSocketConstraint[]
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
		this.toggleBrake(false)
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
		const seat = this.instance.VehicleSeat
		const seat_weld = seat.FindFirstChildOfClass("Weld")
		const pp = character?.PrimaryPart
		if (seat_weld) {
			seat_weld.C0 = new CFrame(0, 0.6, 0)
			seat_weld.C1 = new CFrame(0, 0, 0)
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
	getHeight(): number {
		const root = this.instance.Root
		const ray_info = new RaycastParams()
		ray_info.FilterDescendantsInstances = [
			this.instance,
			this.rider?.Parent
		].filterUndefined()
		ray_info.FilterType = Enum.RaycastFilterType.Blacklist
		const ray = Workspace.Raycast(
			root.Position,
			new Vector3(0, -1, 0).mul(20),
			ray_info
		)
		if (ray) {
			return root.Position.Y - ray.Position.Y
		}
		return math.huge
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
		const wheel_constraints = this.instance
			.GetDescendants()
			.filter((descendant) =>
				descendant.IsA("BallSocketConstraint")
			) as BallSocketConstraint[]
		wheel_constraints.forEach((constraint) => {
			constraint.MaxFrictionTorque = enable ? 30 : 5
		})
		this.brakeListener.Fire(enable)
		this.toggleFriction(enable)
		this.brake = enable
	}
	private __last_flip_time = 0
	flipCart(): void {
		if (!this.rider) return
		const now = tick()
		if (now - this.__last_flip_time < 3) {
			return
		}
		this.__last_flip_time = now
		const attachment = this.instance.Root.FindFirstChild("Root") as Attachment
		const align_position = new Instance("AlignPosition", this.instance.Root)

		align_position.MaxForce = math.huge
		align_position.Responsiveness = 20
		align_position.Position = this.instance.Root.Position.add(
			new Vector3(0, 5, 0)
		)
		align_position.Attachment0 = attachment
		align_position.Mode = Enum.PositionAlignmentMode.OneAttachment
		const align_orientation = new Instance(
			"AlignOrientation",
			this.instance.Root
		)
		align_orientation.MaxTorque = math.huge
		align_orientation.Responsiveness = 20
		align_orientation.Mode = Enum.OrientationAlignmentMode.OneAttachment
		align_orientation.Attachment0 = attachment
		const y_orientation = this.instance.Root.Orientation.Y
		print("Current Y orientation: " + y_orientation)
		// make the cart look at the direction of its root

		const rotated_cframe = new CFrame((this.instance.Root.Position).add(new Vector3(0, 5, 0))).mul(
			CFrame.Angles(math.rad(180), 0, math.rad(y_orientation))
		)
		const lookat_pos = rotated_cframe.Position.add(
			rotated_cframe.LookVector.mul(5)
		)
		align_orientation.LookAtPosition = lookat_pos

		// align_orientation.LookAtPosition = new CFrame(this.instance.Root.Position)
		// 	.mul(CFrame.Angles(0, math.rad(y_orientation), 0))
		// 	.mul(new CFrame(0, 0, 1)).Position
		task.delay(1, () => {
			align_orientation.Destroy()
			align_position.Destroy()
		})
	}
	cleanupRide(reason: string): void {
		this.logger.log(`Cleaning up ride: ${reason}`)
		this.toggleFriction(false)
		this.setPower(0)
		CartLisener.Fire(undefined)
		if (!this.rider) {
			return
		}
		this.rider.JumpHeight = 7.2
	}
	async onStart() {
		const brake_original = this.instance.Brake
		this.instance.WaitForChild("Root", 10)?.Destroying.Once(() => {
			this.cleanupRide("Root destroyed")
		})
		this.toggleBrake(true)
		let cart_config: ICartEntry | undefined = undefined
		try {
			const [config, err] =
				await ClientFunctions.CartService.getConfig.invokeWithTimeout(5000)
			if (err) {
				this.logger.error("Failed to get config from server: " + err)
			}
			assert(config, "Failed to get config from server")
			cart_config = config.find((entry) => entry.name === this.descriptor)
			assert(
				cart_config,
				`Could not find cart config for descriptor ${this.descriptor}`
			)
		} catch (e) {
			this.logger.warn("Error while getting config from server: " + tostring(e))
		}
		if (cart_config) {
			this.overrideConfig({
				power: cart_config.power,
				friction: cart_config.friction,
				max_velocity: cart_config.max_velocity
			})
		}
		this.instance.Wheels.GetDescendants()
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
				this.cleanupRide("Local player got off the cart")
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
