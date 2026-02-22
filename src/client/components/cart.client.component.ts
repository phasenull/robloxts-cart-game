import { BaseComponent, Component } from "@flamework/components"
import { Dependency, OnPhysics, OnStart } from "@flamework/core"
import { arrow, line, sphere } from "@rbxts/better-gizmos"
import { copy } from "@rbxts/object-utils"
import { MarketplaceService, Players, Workspace } from "@rbxts/services"
import Signal from "@rbxts/signal"
import StringUtils from "@rbxts/string-utils"
import { t } from "@rbxts/t"
import { AnimationController } from "client/controllers/animation.controller"
import { CartController } from "client/controllers/cart.controller"
import { UIHelper } from "client/ui.helper"
import { __STUDIO__ } from "client/ui/constants"
import { IHandBrake } from "shared/cart.helper"
import { Logger } from "shared/logger"
import { ClientEvents, ClientFunctions } from "shared/network.helper"
import { PRODUCTS } from "shared/purchasables"
import { ICart, ICartEntry, IWheel } from "shared/type.helper"
import {
	calculateSteepDiffFromHumanoid,
	normalizeVector3,
	OutlineHighlight
} from "shared/util.helper"

@Component({
	tag: "CartComponent",
	instanceGuard: t.instanceOf("Model")
})
export class CartClientComponent
	extends BaseComponent<{}, ICart>
	implements OnPhysics, OnStart
{
	private stuck_at: undefined | number = 0
	private readonly cart_lever_animation_id = 125184894660712
	private readonly cart_spawn_animation_id = 95061387311577
	private readonly cart_idle_animation_id = 126006910637391
	private rider: Humanoid | undefined
	resolvePlayer(): Player | undefined {
		const rider_character = this.rider?.Parent
		if (!rider_character) return undefined
		return Players.GetPlayerFromCharacter(rider_character)
	}
	private wheel_hitboxes: BasePart[] = []
	private power: number = 170
	private max_velocity = 25
	honk(): void {
		print("honk!")
		ClientEvents.CartService.honk.fire()
	}

	/**
	 * for client -> server -> clients (broadcast)
	 * */
	private replicatedHonk(): void {
		
	}
	public readonly brakeListener = new Signal<(status: boolean) => void>()
	private readonly brakes: ParticleEmitter[] = []
	private descriptor: string = "Cart"
	setDescriptor(new_descriptor: string): void {
		this.descriptor = new_descriptor
		// this.logger.log(`Cart descriptor set to ${new_descriptor}`)
	}
	overrideConfig(args: {
		power: number
		friction: number
		max_velocity: number
	}): void {
		// this.logger.log(
		// 	`Overriding cart config: power=${args.power}, friction=${args.friction}, max_velocity=${args.max_velocity}`
		// )
		this.power = args.power
		this.wheel_friction = args.friction
		this.max_velocity = args.max_velocity
		// this.logger.log("total wheel hitboxes: " + this.wheel_hitboxes.size())
		this.wheel_hitboxes.forEach((hitbox) => {
			// this.logger.log(
			// 	`Setting wheel friction to ${args.friction} for hitbox ${hitbox.Name}`
			// )
			const new_pp = new PhysicalProperties(1, 1, 0)
			hitbox.CustomPhysicalProperties = new_pp
		})
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
	getStuckAt(): number | undefined {
		return this.stuck_at
	}
	getSpeed(): number {
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		if (!root) return 0
		return root.AssemblyLinearVelocity.Magnitude
	}
	setWheelFriction(new_friction: number): void {
		// this.wheel_hitboxes.forEach((hitbox) => {
		// 	hitbox.CustomPhysicalProperties = new PhysicalProperties(
		// 		0.7,
		// 		new_friction,
		// 		0.2
		// 	)
		// })
		this.wheel_friction = new_friction
	}
	private anti_gravity_multiplier = 0.5
	private getSteepAngle() {
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		if (!root) {
			this.cleanupRide("Cart root not found (getSteepAngle)")
			return 0
		}
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
	onPhysics(dt: number, time: number) {
		if (this.__is_cleaned_up) return
		const local_player = Players.LocalPlayer
		const character = local_player.Character
		if (!character) return
		const humanoid = character.FindFirstChildOfClass("Humanoid")
		if (!humanoid) return
		if (this.rider !== humanoid) {
			return
		}
		if (!this.instance.FindFirstChild("Root"))
			return this.cleanupRide("Cart root not found")
		const velocity = this.instance.Root.AssemblyLinearVelocity
		const h = this.getHeight()
		const is_in_air = h > 5
		const max_velocity = this.max_velocity
		const is_going_down = velocity.Y < -10
		this.toggleSteepState(is_going_down && !is_in_air)
		// speed limitting
		// if (velocity.Magnitude > max_velocity && !is_in_air) {
		// 	if (this.is_steep) {
		// 		if (velocity.Magnitude > max_velocity * 2) {
		// 			this.instance.Root.AssemblyLinearVelocity = normalizeVector3(
		// 				velocity,
		// 				max_velocity * 3
		// 			)
		// 		}
		// 	} else {
		// 		this.instance.Root.AssemblyLinearVelocity = normalizeVector3(
		// 			velocity,
		// 			math.lerp(velocity.Magnitude, max_velocity, dt * 10)
		// 		)
		// 	}
		// }
		const force = this.instance.Root.VectorForce
		const mass = this.instance.FindFirstChild("Mass") as BasePart | undefined
		if (!force || !mass) {
			this.cleanupRide("Force or mass instance not found")
			return
		}
		const root = this.instance.Root
		if (this.brake && velocity.Magnitude > 0.01 && !is_in_air) {
			const velocity_direction = normalizeVector3(velocity)
			const brake_force = velocity_direction.mul(-this.wheel_friction * 5)
			force.Force = brake_force
		} else {
			force.Force = humanoid.MoveDirection.mul(this.power).add(
				new Vector3(
					0,
					((root.AssemblyMass * Workspace.Gravity) / 2) *
						this.anti_gravity_multiplier,
					0
				)
			)
		}
		// wheel alignment
		// const direction = humanoid.MoveDirection.Unit
		// if (direction.Magnitude > 0) {
		// 	this.instance.Wheels.GetChildren().forEach((_) => {
		// 		if (!_.IsA("Model")) return
		// 		const model = _ as IWheel
		// 		const wheel = model.WHEEL
		// 		const connection = model.CONNECTION
		// 		const align_orientation =
		// 			connection.FindFirstChildOfClass("AlignOrientation")
		// 		if (!align_orientation) return
		// 		const lookat_pos = connection.Position.add(
		// 			new Vector3(direction.X * 2, 0, direction.Z * 2)
		// 		)
		// 		// if (__STUDIO__) {

		// 		// }
		// 		align_orientation.LookAtPosition = lookat_pos
		// 	})
		// }
		if (this.brake) {
			this.toggleBrake(true)
		} else {
			this.toggleBrake(false)
		}
		const is_checkpoint_available = this.checkCheckpointAvailability()
		if (is_checkpoint_available) {
			this.CartController.saveCheckpoint(this.instance.GetPivot())
		}
		const y_positon = this.instance.Root.Position.Y
		if (y_positon < -66) {
			this.cleanupRide("Player fell off the map")
		}
	}
	private logger: Logger
	constructor(
		private AnimationController: AnimationController,
		private CartController: CartController
	) {
		super()

		const instance_name = this.instance.Name
		const cart_name = instance_name.split("_")[0]
		this.logger = new Logger(`CartClientComponent::${cart_name}`)
		this.setDescriptor(this.instance.Name.split("_")[0])
	}
	private brake_animation_track: AnimationTrack | undefined
	private wheel_friction = 2
	getPower(): number {
		return this.power
	}
	setPower(new_power: number) {
		this.power = new_power
	}

	toggleFriction(enabled: boolean) {
		if (enabled) {
			// this.wheel_hitboxes.forEach((hitbox) => {
			// 	const new_pp = new PhysicalProperties(1, this.wheel_friction, 0)
			// 	hitbox.CustomPhysicalProperties = new_pp
			// })
		} else {
			// this.wheel_hitboxes.forEach((hitbox) => {
			// 	hitbox.CustomPhysicalProperties = new PhysicalProperties(0.7, 0, 0.2)
			// })
		}
		const wheel_constraints = this.instance
			.GetDescendants()
			.filter((descendant) =>
				descendant.IsA("BallSocketConstraint")
			) as BallSocketConstraint[]
		wheel_constraints.forEach((constraint) => {
			constraint.MaxFrictionTorque = enabled ? this.wheel_friction : 5
		})
	}
	private brake = false
	onRide(): void {
		const player = Players.LocalPlayer
		const character = player.Character
		const my_hunanoid = character?.FindFirstChildOfClass("Humanoid")
		const model = this.rider?.Parent
		if (model?.Name === "Player") return
		if (my_hunanoid !== this.rider) {
			return
		}
		if (!this.instance.WaitForChild("VehicleSeat", 1)) {
			this.cleanupRide("no vehicle seat found at onride")
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
			seat_weld.C0 = new CFrame(0.1, 0.3, 0.15)
			seat_weld.C1 = new CFrame(0, 0, 0)
		}
		this.brake_animation_track = this.AnimationController.preload({
			key: "cart_lever",
			animationId: this.cart_lever_animation_id
		})
		// const conn = this.rider.GetPropertyChangedSignal("Jump").Connect(() => {
		// 	const value = humanoid.Jump
		// 	if (!this.rider || this.rider !== humanoid) {
		// 		conn.Disconnect()
		// 		return
		// 	}
		// 	if (value) {
		// 		this.toggleBrake(true)
		// 	} else {
		// 		this.toggleBrake(false)
		// 	}
		// })
		const cart_controller = Dependency<CartController>()
		cart_controller.onCartChange.Fire(this)
	}
	getHeight(): number {
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		if (!root) {
			this.cleanupRide("Cart root not found (getHeight)")
			return 0
		}
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
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		if (!root) {
			this.cleanupRide("Cart root not found (toggleBrake)")
			return
		}
		if (this.instance.Root.AssemblyLinearVelocity.Magnitude > 1 && enable) {
			for (const brake of this.brakes) {
				brake.Enabled = true
			}
		} else {
			for (const brake of this.brakes) {
				brake.Enabled = false
			}
		}
		if (this.brake_animation_track) {
			this.brake_animation_track.Priority = Enum.AnimationPriority.Action4
			this.brake_animation_track.AdjustSpeed(0)
			this.brake_animation_track.Looped = true
			if (enable) {
				this.brake_animation_track.Play()
			} else {
				this.brake_animation_track.Stop()
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
		this.brake = enable
		this.brakeListener.Fire(enable)
		this.toggleFriction(enable)
		const anim = this.brake_animation_track
		if (anim) {
			if (enable) {
				anim.Looped = true
				anim.Play()
			} else {
				anim.Stop()
			}
		}
		const handbrake = this.instance.FindFirstChild("HandBrake") as IHandBrake
		if (handbrake) {
			const motor = handbrake.RootPart.FindFirstChildOfClass("Motor6D")
			if (motor) {
				motor.DesiredAngle = this.brake ? -0.3 : 0
			} else {
				this.logger.warn("Motor6D not found in HandBrake")
			}
		} else {
			this.logger.warn("HandBrake model not found in cart instance")
		}
	}
	private __is_flipping = false
	async promptFlip(): Promise<boolean> {
		if (this.__is_flipping) {
			return false
		}
		this.__is_flipping = true
		const [use_result, err] =
			await ClientFunctions.CartService.useProduct.invokeWithTimeout(
				5000,
				"flips"
			)
		if (use_result) {
			this.flipCart()
			return true
		}
		MarketplaceService.PromptProductPurchase(
			Players.LocalPlayer,
			PRODUCTS.flips
		)
		const connection = MarketplaceService.PromptProductPurchaseFinished.Connect(
			async (user_id, assetId, wasPurchased) => {
				if (user_id !== Players.LocalPlayer.UserId) return
				if (assetId !== PRODUCTS.flips) return
				connection.Disconnect()
				if (!wasPurchased) return
				this.flipCart()
				await ClientFunctions.CartService.useProduct.invokeWithTimeout(
					5000,
					"flips"
				)
			}
		)
		return true
	}
	flipCart() {
		if (!this.rider) return false
		const now = tick()
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

		const rotated_cframe = new CFrame(
			this.instance.Root.Position.add(new Vector3(0, 5, 0))
		).mul(CFrame.Angles(math.rad(180), 0, math.rad(y_orientation)))
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
			task.delay(1, () => {
				this.__is_flipping = false
			})
		})
		return true
	}
	private __is_cleaned_up = false
	async cleanupRide(reason: string): Promise<void> {
		const player = Players.LocalPlayer
		const character = player.Character
		const humanoid = character?.FindFirstChildOfClass("Humanoid")
		const model = this.rider?.Parent
		if (model?.Name === "Player") return
		if (humanoid !== this.rider) {
			return
		}
		if (this.__is_cleaned_up) return
		if (this.resolvePlayer() !== Players.LocalPlayer) {
			return
		}
		if (this.rider && this.rider === humanoid) {
			if (this.rider.Seated) {
				this.rider.Sit = false
			}
		}
		this.logger.warn(`Cleaning up ride due to: ${reason}`)
		const cart_controller = Dependency<CartController>()
		cart_controller.onCartChange.Fire(undefined)
		this.__is_cleaned_up = true
		this.AnimationController.stop("cart_idle", 0)
		const controller = Dependency<CartController>()
		// UIHelper.toggleFade(true)
		// ClientEvents.CartService.cleanupCart.fire()
		if (humanoid) {
			humanoid.Sit = false
		}
		await ClientFunctions.CheckpointService.tpMeToBigCheckpoint.invokeWithTimeout(
			5000
		)
		controller.toggleDeathScreen(true)
		// UIHelper.toggleFade(false)

		// this.toggleFriction(false)
		// this.setPower(0)
		// if (!this.rider) {
		// 	return
		// }
	}
	onStart(): void {
		this.bootstrap()
	}
	triggetOccupantChanged(): void {
		const seat = this.instance.FindFirstChild("VehicleSeat") as Seat | undefined
		if (!seat) {
			this.cleanupRide("Vehicle seat not found")
			return
		}
		const new_rider = seat.Occupant as Humanoid | undefined
		const player = Players.LocalPlayer
		const char = player.Character
		const humanoid = char?.FindFirstChildOfClass("Humanoid")
		if (new_rider === undefined && this.rider === humanoid) {
			// local player just got off
			this.rider = undefined
			this.logger.log("Local player got off the cart")
			this.cleanupRide("Local player got off the cart")
			return
		}
		if (new_rider === humanoid) {
			// local player just got on
			this.rider = humanoid
			// this.logger.log("Local player got on the cart")
			this.onRide()
			return
		}
	}
	private __is_bootstrapped = false
	async bootstrap() {
		if (this.__is_bootstrapped) return

		this.__is_bootstrapped = true
		const brake_original = this.instance.WaitForChild("Brake", 1) as
			| ParticleEmitter
			| undefined
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

			if (!cart_config) {
				this.logger.warn(
					`No cart config found for descriptor ${this.descriptor}, falling back to "Cart"`
				)
				cart_config = config.find((entry) => entry.name === "Cart")
				if (!cart_config) {
					this.logger.warn(
						`!!FATAL!! No cart config found for default cart, cleaning up ride ${this.descriptor}`
					)
					this.cleanupRide("Failed to get config from server")
					return
				}
			}
		} catch (e) {
			this.logger.warn("Error while getting config from server: " + tostring(e))
		}
		if (cart_config) {
			this.overrideConfig({
				power: cart_config.power,
				friction: cart_config.friction,
				max_velocity: 25
			})
		}
		this.instance
			.FindFirstChild("Wheels")
			?.GetDescendants()
			.filter((child) => child.Name === "BALL")
			.forEach((child) => {
				if (child.IsA("BasePart")) {
					const brake = brake_original?.Clone()
					if (!brake) return
					this.wheel_hitboxes.push(child as BasePart)
					brake.Parent = child
					brake.Enabled = false
					this.brakes.push(brake)
				}
			})
		this.AnimationController.preload({
			key: "cart_spawn",
			animationId: this.cart_spawn_animation_id
		})
		this.AnimationController.preload({
			key: "cart_idle",
			animationId: this.cart_idle_animation_id
		})
		if (!this.instance.WaitForChild("VehicleSeat", 1)) {
			this.cleanupRide("no vehicle seat found at bootstrap")
			return
		}
		const seat = this.instance.VehicleSeat
		if (!this.rider && seat.Occupant) {
			// handle case where player is already sitting in the cart before component initializes
			this.triggetOccupantChanged()
		}

		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			this.triggetOccupantChanged()
		})
	}
	checkCheckpointAvailability(): boolean {
		const h = this.getHeight()
		const is_in_air = h > 5
		if (is_in_air) {
			if (!this.stuck_at) {
				this.stuck_at = tick()
			}
			return false
		}
		const steepness = this.getSteepAngle()
		if (steepness > math.rad(3)) {
			if (!this.stuck_at) {
				this.stuck_at = tick()
			}
			return false
		}

		// also send 4 raycasts from the bounding box corners to the ground and check if any of them are hitting the ground within 10 studs
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		if (!root) {
			this.cleanupRide("Cart root not found (checkCheckpointAvailability)")
			if (!this.stuck_at) {
				this.stuck_at = tick()
			}
			return false
		}
		const size = root.Size
		const dead_zone = 3
		const corners = [
			new Vector3(size.X / 2 + dead_zone, 0, size.Z / 2 + dead_zone),
			new Vector3(-size.X / 2 - dead_zone, 0, size.Z / 2 + dead_zone),
			new Vector3(size.X / 2 + dead_zone, 0, -size.Z / 2 - dead_zone),
			new Vector3(-size.X / 2 - dead_zone, 0, -size.Z / 2 - dead_zone)
		]
		const ray_info = new RaycastParams()
		ray_info.FilterDescendantsInstances = [
			this.instance,
			this.rider?.Parent
		].filterUndefined()
		ray_info.IgnoreWater = true
		ray_info.FilterType = Enum.RaycastFilterType.Blacklist
		for (const corner of corners) {
			const ray = Workspace.Raycast(
				root.Position.add(corner),
				new Vector3(0, -1, 0).mul(9),
				ray_info
			)
			if (!ray) {
				if (!this.stuck_at) {
					this.stuck_at = tick()
				}
				return false
			}
			if (ray.Instance.Name === "AntiRevive") {
				return false
			}
		}
		this.stuck_at = undefined
		return true
	}
}

