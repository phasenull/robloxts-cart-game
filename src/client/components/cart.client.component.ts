import { Players, Workspace } from "@rbxts/services"
import Signal from "@rbxts/signal"
import type { Trove } from "@rbxts/trove"
import { Dependency } from "@typetorch/framework"
import type { AnimationController } from "client/controllers/animation.controller"
import { Logger } from "shared/common/logger"
import type { CartController } from "client/controllers/cart.controller"
import { IHandBrake } from "shared/cart.helper"
import { buildCartRaycastParams, getCartMass, getCartYawInertia, isSafeRestPose, probeWheels } from "shared/cart.physics"
import { CART_TUNING, CartStats, getCartDescriptor, resolveCartStats } from "shared/cart.tuning"
import { TaggedComponent } from "shared/component"
import { network } from "shared/net"
import { ICart } from "shared/type.helper"

type CartRoot = ICart["Root"]

function approach(current: number, target: number, step: number): number {
	return current < target ? math.min(current + step, target) : math.max(current - step, target)
}

function lerp(a: number, b: number, alpha: number): number {
	return a + (b - a) * alpha
}

/**
 * Drives the local player's cart. The client owns the assembly's physics, so this sets the
 * rig's constraints every physics step from VehicleSeat input:
 * - DriveForce (VectorForce): throttle / brake / reverse along the ground plane, sideways tyre
 *   grip, drag and a soft overspeed limiter. Gravity still acts, so slopes really matter.
 * - SteerTorque (Torque): speed-sensitive yaw rate around the ground normal only.
 * - Upright (AlignOrientation): gentle self-righting while airborne or tipping.
 *
 * Tag "CartComponent", guard t.instanceOf("Model").
 */
export class CartClientComponent extends TaggedComponent<ICart> {
	public readonly handbrakeChanged = new Signal<(engaged: boolean) => void>()
	private readonly logger: Logger
	private readonly descriptor: string
	private readonly stats: CartStats

	private rider: Humanoid | undefined
	private riding = false
	private ended = false
	private handbrake = false
	private flipping = false

	private throttle = 0
	private steer = 0
	private airborne_since: number | undefined
	private braking = false
	private grounded = false
	private slip = 0
	private stuck_at: number | undefined
	private next_rest_sample = 0

	private wheels: BasePart[] = []
	private initial_wheel_count = 0
	private brake_emitters: ParticleEmitter[] = []
	private casters: { motor: Motor6D; front: boolean }[] = []
	/** visual wheels rolled every frame: axle-angle, radius from the WHEEL cylinder */
	private spinners: { motor: Motor6D; wheel: BasePart; radius: number; angle: number }[] = []
	/** visual steer of other players' carts, smoothed from the replicated seat input */
	private visual_steer = 0
	private raycast_params = buildCartRaycastParams([])
	private lever_track: AnimationTrack | undefined
	private base_fov = CART_TUNING.feel.baseFov
	/** yaw inertia per unit mass of the "Mass" box (the chassis' only massive part); the wheel balls are added per step */
	private chassis_inertia_per_mass = 1
	private saved_jump = { height: 7.2, power: 50 }

	constructor(instance: ICart, trove: Trove) {
		super(instance, trove)
		this.descriptor = getCartDescriptor(this.instance)
		this.logger = new Logger(`CartClientComponent::${this.descriptor}`)
		this.stats = resolveCartStats(this.descriptor)
		this.trove.add(this.handbrakeChanged)
	}

	onStart(): void {
		this.trove.add(task.spawn(() => this.bootstrap()))
	}

	private bootstrap() {
		const root = this.instance.WaitForChild("Root", 10) as CartRoot | undefined
		const seat = this.instance.WaitForChild("VehicleSeat", 10) as VehicleSeat | undefined
		if (!root || !seat) {
			this.logger.warn("Cart rig did not replicate (Root/VehicleSeat missing)")
			return
		}
		this.trove.connect(root.Destroying, () => this.endRide("Root destroyed"))

		const brake_template = this.instance.FindFirstChild("Brake") as ParticleEmitter | undefined
		const wheels = this.instance.WaitForChild("Wheels", 5)
		wheels?.GetChildren().forEach((model) => {
			if (!model.IsA("Model")) return
			const ball = model.WaitForChild("BALL", 5) as BasePart | undefined
			if (ball) {
				this.wheels.push(ball)
				const emitter = brake_template?.Clone()
				if (emitter) {
					this.trove.add(emitter)
					emitter.Enabled = false
					emitter.Parent = ball
					this.brake_emitters.push(emitter)
				}
			}
			const caster = model.FindFirstChild("CONNECTION")?.FindFirstChild("Caster") as Motor6D | undefined
			if (caster) {
				this.casters.push({ motor: caster, front: model.Name.sub(1, 1) === "F" })
			}
			const wheel = model.FindFirstChild("WHEEL") as BasePart | undefined
			const spin = wheel?.FindFirstChild("Spin") as Motor6D | undefined
			// an invisible WHEEL is a stand-in (Hover Cart's pads): steer it, don't roll it
			if (wheel && spin && wheel.Transparency < 1) {
				const radius = math.min(wheel.Size.Y, wheel.Size.Z) / 2
				this.spinners.push({ motor: spin, wheel, radius: math.max(radius, 0.1), angle: 0 })
			}
		})
		this.initial_wheel_count = this.wheels.size()
		const mass_part = this.instance.WaitForChild("Mass", 5) as BasePart | undefined
		if (mass_part) {
			const size = mass_part.Size
			this.chassis_inertia_per_mass = (size.X * size.X + size.Z * size.Z) / 12
		}

		Dependency<AnimationController>().preload({ key: "cart_spawn", animationId: CART_TUNING.animations.spawn })
		Dependency<AnimationController>().preload({ key: "cart_idle", animationId: CART_TUNING.animations.idle })

		this.trove.connect(seat.GetPropertyChangedSignal("Occupant"), () => this.onOccupantChanged())
		this.onOccupantChanged()
	}

	private onOccupantChanged() {
		const seat = this.instance.FindFirstChild("VehicleSeat") as VehicleSeat | undefined
		const local_humanoid = Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid")
		const occupant = seat?.Occupant
		if (!this.riding && !this.ended && occupant && occupant === local_humanoid) {
			this.beginRide(occupant)
		} else if (this.riding && occupant !== this.rider) {
			this.endRide("Local player got off the cart")
		}
	}

	private beginRide(humanoid: Humanoid) {
		this.rider = humanoid
		this.riding = true
		this.raycast_params = buildCartRaycastParams([this.instance, humanoid.Parent].filterUndefined())
		// jumping is how a seated humanoid leaves; Space is the handbrake while riding
		this.saved_jump = { height: humanoid.JumpHeight, power: humanoid.JumpPower }
		humanoid.JumpHeight = 0
		humanoid.JumpPower = 0
		humanoid.SetStateEnabled(Enum.HumanoidStateType.Jumping, false)

		Dependency<AnimationController>().stopAll()
		Dependency<AnimationController>().play({
			key: "cart_spawn",
			priority: Enum.AnimationPriority.Action2,
			speed: 0.7,
			animationId: CART_TUNING.animations.spawn
		})
		Dependency<AnimationController>().play({
			key: "cart_idle",
			priority: Enum.AnimationPriority.Action2,
			speed: 1,
			animationId: CART_TUNING.animations.idle,
			looped: true
		})
		this.lever_track = Dependency<AnimationController>().preload({
			key: "cart_lever",
			animationId: CART_TUNING.animations.lever
		})
		this.base_fov = Workspace.CurrentCamera?.FieldOfView ?? CART_TUNING.feel.baseFov
		// the revive anchor starts where this cart spawned, like the server's safe pose (CartService.recordSafePivot):
		// an anchor left from an earlier ride is hundreds of studs off and the server would overrule it
		Dependency<CartController>().saveCheckpoint(this.instance.GetPivot())
		Dependency<CartController>().onCartChange.Fire(this)
	}

	/** Ends the local ride: back to the last big checkpoint and the death screen. */
	async endRide(reason: string): Promise<void> {
		if (!this.riding || this.ended) return
		this.ended = true
		this.riding = false
		this.logger.warn(`Ending ride: ${reason}`)
		this.releaseControls()
		this.setHandbrake(false)
		const humanoid = this.rider
		if (humanoid) {
			humanoid.JumpHeight = this.saved_jump.height
			humanoid.JumpPower = this.saved_jump.power
			humanoid.SetStateEnabled(Enum.HumanoidStateType.Jumping, true)
			humanoid.Sit = false
		}
		const camera = Workspace.CurrentCamera
		if (camera) camera.FieldOfView = this.base_fov
		Dependency<AnimationController>().stop("cart_idle", 0)
		await Dependency<CartController>().showDeathScreen()
	}

	private releaseControls() {
		const root = this.instance.FindFirstChild("Root") as CartRoot | undefined
		if (!root) return
		const drive = root.FindFirstChild("DriveForce") as VectorForce | undefined
		const steer = root.FindFirstChild("SteerTorque") as Torque | undefined
		const upright = root.FindFirstChild("Upright") as AlignOrientation | undefined
		if (drive) drive.Force = Vector3.zero
		if (steer) steer.Torque = Vector3.zero
		if (upright) upright.Enabled = false
	}

	onPhysics(dt: number): void {
		if (!this.riding || this.flipping || dt <= 0) return
		const root = this.instance.FindFirstChild("Root") as CartRoot | undefined
		if (!root) {
			this.endRide("Cart root missing")
			return
		}
		// rig still replicating
		if (!root.FindFirstChild("DriveForce") || !root.FindFirstChild("SteerTorque") || !root.FindFirstChild("Upright") || !root.FindFirstChild("Drive")) {
			return
		}
		if (root.Position.Y < CART_TUNING.chassis.fallKillY) {
			this.endRide("Player fell off the map")
			return
		}
		this.stepVehicle(root, dt)
		this.sampleRestPose(root)
	}

	private stepVehicle(root: CartRoot, dt: number) {
		const T = CART_TUNING
		const stats = this.stats
		const seat = this.instance.VehicleSeat
		const frame = root.Drive.WorldCFrame
		const contact = probeWheels(this.wheels, frame.UpVector, this.raycast_params)
		const grounded = contact.contacts > 0
		const traction = this.initial_wheel_count > 0 ? contact.contacts / this.initial_wheel_count : 0
		const normal = contact.normal

		// chassis axes projected onto the ground plane
		const look = frame.LookVector
		const projected = look.sub(normal.mul(look.Dot(normal)))
		const forward = projected.Magnitude > 1e-3 ? projected.Unit : look
		const right = forward.Cross(normal)

		const velocity = root.AssemblyLinearVelocity
		const mass = getCartMass(root, this.wheels)
		const v_fwd = velocity.Dot(forward)
		const v_lat = velocity.Dot(right)
		const gravity = Workspace.Gravity * T.chassis.gravityScale

		// smoothed input; VehicleSeat maps keyboard, gamepad and the mobile thumbstick
		const throttle_in = math.clamp(seat.ThrottleFloat, -1, 1)
		const steer_in = math.clamp(seat.SteerFloat, -1, 1)
		const rising = math.abs(throttle_in) > math.abs(this.throttle)
		this.throttle = approach(
			this.throttle,
			throttle_in,
			(rising ? T.drive.throttleRiseRate : T.drive.throttleFallRate) * dt
		)
		this.steer = approach(this.steer, steer_in, T.steering.steerRate * dt)

		// longitudinal: drive / brake / reverse / coast / hold
		const stopping = (decel: number) => -math.sign(v_fwd) * math.min(decel, math.abs(v_fwd) / dt)
		let a_fwd = 0
		let braking = false
		if (grounded) {
			if (this.handbrake) {
				a_fwd = stopping(stats.handbrakeDecel)
				braking = true
			} else if (this.throttle > 0.01) {
				if (v_fwd < -T.drive.reverseThreshold) {
					a_fwd = stopping(stats.brakeDecel * this.throttle)
					braking = true
				} else {
					a_fwd = this.throttle * stats.acceleration * math.max(0, 1 - math.max(v_fwd, 0) / stats.topSpeed)
				}
			} else if (this.throttle < -0.01) {
				if (v_fwd > T.drive.reverseThreshold) {
					a_fwd = stopping(stats.brakeDecel * -this.throttle)
					braking = true
				} else {
					a_fwd =
						this.throttle *
						stats.reverseAcceleration *
						math.max(0, 1 - math.max(-v_fwd, 0) / stats.reverseTopSpeed)
				}
			} else {
				const slope = math.acos(math.clamp(normal.Dot(Vector3.yAxis), -1, 1))
				if (velocity.Magnitude < T.drive.holdSpeed && slope <= math.rad(T.drive.holdMaxSlopeDeg)) {
					// parked: cancel gravity along the slope and any creep
					const gravity_along = -gravity * Vector3.yAxis.Dot(forward)
					a_fwd = math.clamp(-gravity_along - v_fwd / dt, -stats.brakeDecel, stats.brakeDecel)
				} else {
					a_fwd = stopping(T.drive.rollingResistance)
				}
			}
			a_fwd *= traction
		}

		// lateral tyre grip, weaker on the handbrake so the rear steps out
		let a_lat = 0
		if (grounded) {
			const grip_factor = this.handbrake ? T.grip.handbrakeGripFactor : 1
			const max_lat = math.min(T.grip.maxLateralAccel * traction * grip_factor, math.abs(v_lat) / dt)
			a_lat = math.clamp(-v_lat * T.grip.response, -max_lat, max_lat)
		}

		// drag plus a soft limiter on gravity-fed overspeed (vertical falls are left alone in the air)
		const planar = grounded ? velocity : new Vector3(velocity.X, 0, velocity.Z)
		const planar_speed = planar.Magnitude
		let drag = T.drive.quadraticDrag * planar_speed * planar_speed
		const overspeed_cap = stats.topSpeed * T.drive.overspeedFactor
		if (planar_speed > overspeed_cap) {
			drag += (planar_speed - overspeed_cap) * T.drive.overspeedDamping
		}
		drag = math.min(drag, planar_speed / dt)
		const a_drag = planar_speed > 1e-3 ? planar.Unit.mul(-drag) : Vector3.zero
		const lift = Vector3.yAxis.mul(Workspace.Gravity * (1 - T.chassis.gravityScale))

		root.DriveForce.Force = forward.mul(a_fwd).add(right.mul(a_lat)).add(a_drag).add(lift).mul(mass)

		// yaw around the ground normal; reversing inverts steering like a real car
		const steer_ctl = root.SteerTorque
		if (grounded) {
			const abs_fwd = math.abs(v_fwd)
			const low_speed = math.clamp(abs_fwd / T.steering.fullSteerSpeed, T.steering.minSteerFactor, 1)
			const high_speed = lerp(1, T.steering.highSpeedSteerFactor, math.clamp(abs_fwd / stats.topSpeed, 0, 1))
			const direction = v_fwd < -0.5 ? -1 : 1
			let yaw = -this.steer * T.steering.maxYawRate * low_speed * high_speed * direction
			if (this.handbrake) yaw *= T.steering.handbrakeSteerBoost
			// first-order yaw-rate controller about the ground normal only
			const yaw_error = yaw - root.AssemblyAngularVelocity.Dot(normal)
			const max_torque = mass * T.steering.torquePerMass * math.max(traction, 0.25)
			const inertia = getCartYawInertia(root, this.wheels, this.chassis_inertia_per_mass, normal)
			const torque = (inertia * yaw_error) / T.steering.yawResponseTime
			steer_ctl.Torque = normal.mul(math.clamp(torque, -max_torque, max_torque))
		} else {
			steer_ctl.Torque = Vector3.zero
		}

		// self-righting while airborne or balancing on fewer than two wheels
		const now = os.clock()
		if (contact.contacts >= 2) {
			this.airborne_since = undefined
		} else if (this.airborne_since === undefined) {
			this.airborne_since = now
		}
		const upright_on = this.airborne_since !== undefined && now - this.airborne_since >= T.air.uprightDelay
		root.Upright.Enabled = upright_on
		root.Upright.MaxTorque = upright_on ? mass * T.air.uprightTorquePerMass : 0

		this.grounded = grounded
		this.braking = braking
		this.slip = math.abs(v_lat)
	}

	private sampleRestPose(root: BasePart) {
		const now = os.clock()
		if (now < this.next_rest_sample) return
		this.next_rest_sample = now + CART_TUNING.restPose.sampleInterval
		if (isSafeRestPose(root, this.raycast_params)) {
			this.stuck_at = undefined
			Dependency<CartController>().saveCheckpoint(this.instance.GetPivot())
		} else if (this.stuck_at === undefined) {
			this.stuck_at = tick()
		}
	}

	onRender(dt: number): void {
		this.animateWheels(dt)
		if (!this.riding) return
		const F = CART_TUNING.feel
		const speed = this.getSpeed()
		const camera = Workspace.CurrentCamera
		if (camera) {
			const boost = F.maxFovBoost * math.clamp(speed / (this.stats.topSpeed * 1.5), 0, 1)
			camera.FieldOfView = lerp(camera.FieldOfView, this.base_fov + boost, math.clamp(dt * F.fovLerpRate, 0, 1))
		}
		const smoking =
			this.grounded &&
			((this.braking && speed > F.brakeParticleMinSpeed) || this.slip > F.driftSlipSpeed)
		for (const emitter of this.brake_emitters) {
			emitter.Enabled = smoking && emitter.Parent !== undefined
		}
	}

	/**
	 * Visual wheels, every cart on every client (Motor6D.Transform is local, so nothing replicates):
	 * - front casters yaw about chassis up through the wheel centre (the Caster C0 is in the chassis frame);
	 * - every wheel rolls about its axle at (velocity at the wheel . rolling direction) / radius, so it follows
	 *   forward/reverse, turns and slides. Rolling sits under the caster, so it's yaw first, then roll.
	 */
	private animateWheels(dt: number) {
		if (this.casters.isEmpty() && this.spinners.isEmpty()) return
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		const camera = Workspace.CurrentCamera
		if (!root || !camera || root.Position.sub(camera.CFrame.Position).Magnitude > CART_TUNING.wheel.animateDistance) {
			return
		}
		let steer = this.steer
		if (!this.riding) {
			const seat = this.instance.FindFirstChild("VehicleSeat") as VehicleSeat | undefined
			const target = seat?.Occupant ? math.clamp(seat.SteerFloat, -1, 1) : 0
			this.visual_steer = approach(this.visual_steer, target, CART_TUNING.steering.steerRate * dt)
			steer = this.visual_steer
		}
		const caster_yaw = CFrame.Angles(0, -steer * math.rad(CART_TUNING.steering.visualCasterAngleDeg), 0)
		for (const caster of this.casters) {
			if (caster.front) caster.motor.Transform = caster_yaw
		}

		const up = root.CFrame.UpVector
		for (const spinner of this.spinners) {
			const wheel = spinner.wheel
			if (wheel.Parent === undefined) continue
			// rolling without slip: omega = (up x v) / r, its component along the axle (the Cylinder's X)
			const axle = wheel.CFrame.RightVector
			const velocity = root.GetVelocityAtPosition(wheel.Position)
			const rate = velocity.Dot(axle.Cross(up)) / spinner.radius
			spinner.angle = (spinner.angle + rate * dt) % (2 * math.pi)
			spinner.motor.Transform = CFrame.Angles(spinner.angle, 0, 0)
		}
	}

	private resetWheels() {
		for (const caster of this.casters) caster.motor.Transform = new CFrame()
		for (const spinner of this.spinners) spinner.motor.Transform = new CFrame()
	}

	setHandbrake(engaged: boolean): void {
		if (this.handbrake === engaged) return
		this.handbrake = engaged
		if (this.lever_track) {
			this.lever_track.Priority = Enum.AnimationPriority.Action4
			this.lever_track.Looped = true
			if (engaged) {
				this.lever_track.Play()
				this.lever_track.AdjustSpeed(0)
			} else {
				this.lever_track.Stop()
			}
		}
		const lever = (this.instance.FindFirstChild("HandBrake") as IHandBrake | undefined)?.RootPart.FindFirstChildOfClass(
			"Motor6D"
		)
		if (lever) lever.DesiredAngle = engaged ? -0.3 : 0
		this.handbrakeChanged.Fire(engaged)
	}

	isHandbrakeEngaged(): boolean {
		return this.handbrake
	}

	honk(): void {
		network.client.CartService.honk.fire()
	}

	/** Paid flip: the server has to accept the product use first. */
	async promptFlip(): Promise<boolean> {
		if (!this.riding || this.flipping) return false
		const [ok, err] = await network.client.CartService.useProduct.invokeWithTimeout(5, "flips")
		if (!ok) {
			this.logger.warn(`Flip rejected: ${err}`)
			return false
		}
		return this.flipUpright()
	}

	/** Lifts the cart and sets it back on its wheels, keeping its heading. */
	flipUpright(): boolean {
		if (!this.riding || this.flipping) return false
		const root = this.instance.FindFirstChild("Root") as CartRoot | undefined
		if (!root) return false
		const F = CART_TUNING.flip
		this.flipping = true
		this.releaseControls()

		const target_position = root.Position.add(new Vector3(0, F.lift, 0))
		const frame = root.Drive.WorldCFrame
		let heading = new Vector3(frame.LookVector.X, 0, frame.LookVector.Z)
		if (heading.Magnitude < 0.1) heading = new Vector3(frame.UpVector.X, 0, frame.UpVector.Z)
		if (heading.Magnitude < 0.1) heading = new Vector3(0, 0, -1)

		const align_position = new Instance("AlignPosition")
		align_position.Mode = Enum.PositionAlignmentMode.OneAttachment
		align_position.Attachment0 = root.Root
		align_position.Position = target_position
		align_position.MaxForce = math.huge
		align_position.Responsiveness = F.responsiveness
		align_position.Parent = root

		const align_orientation = new Instance("AlignOrientation")
		align_orientation.Mode = Enum.OrientationAlignmentMode.OneAttachment
		align_orientation.Attachment0 = root.Drive
		align_orientation.CFrame = CFrame.lookAt(target_position, target_position.add(heading.Unit))
		align_orientation.MaxTorque = math.huge
		align_orientation.Responsiveness = F.responsiveness
		align_orientation.Parent = root

		this.trove.add(align_position)
		this.trove.add(align_orientation)
		this.trove.add(task.delay(F.duration, () => {
				align_position.Destroy()
				align_orientation.Destroy()
				this.trove.add(task.delay(F.cooldown, () => {
						this.flipping = false
					})
				)
			})
		)
		return true
	}

	isUpsideDown(): boolean {
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		return root !== undefined && root.CFrame.UpVector.Dot(Vector3.yAxis) < 0
	}

	resolvePlayer(): Player | undefined {
		const occupant = (this.instance.FindFirstChild("VehicleSeat") as VehicleSeat | undefined)?.Occupant
		return occupant ? Players.GetPlayerFromCharacter(occupant.Parent) : undefined
	}

	getDescriptor(): string {
		return this.descriptor
	}

	getStats(): CartStats {
		return this.stats
	}

	getSpeed(): number {
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		return root ? root.AssemblyLinearVelocity.Magnitude : 0
	}

	getMissingWheelCount(): number {
		return this.wheels.filter((w) => !w.IsDescendantOf(game)).size()
	}

	/** tick() since when the cart has not been in a safe rest pose, undefined while it is. */
	getStuckAt(): number | undefined {
		return this.stuck_at
	}

	destroy(): void {
		this.resetWheels()
		// A swap (or the cart going away) while riding: give the humanoid its jump back and reset the camera. The
		// next generation sets the ride up again if the player is still seated.
		if (this.riding) {
			this.releaseControls()
			const humanoid = this.rider
			if (humanoid) {
				humanoid.JumpHeight = this.saved_jump.height
				humanoid.JumpPower = this.saved_jump.power
				humanoid.SetStateEnabled(Enum.HumanoidStateType.Jumping, true)
			}
			const camera = Workspace.CurrentCamera
			if (camera) camera.FieldOfView = this.base_fov
			// The cart left the world under the rider (the server destroyed it: wheels gone, a teleport, a respawn, a
			// server swap). The component is torn down before Root.Destroying could end the ride, so the controller
			// takes it from here: the UI drops this cart now, and the death screen opens unless a new cart or
			// character turns up (CartController.onRideLost).
			if (!this.ended && !this.instance.IsDescendantOf(Workspace)) {
				this.ended = true
				this.riding = false
				Dependency<AnimationController>().stop("cart_idle", 0)
				Dependency<CartController>().onRideLost(this.rider)
			}
		}
	}
}
