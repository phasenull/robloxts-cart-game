import { TweenService, Workspace } from "@rbxts/services"
import { ICart, IWheel } from "./type.helper"
import { CART_TUNING } from "./cart.tuning"

import StringUtils from "@rbxts/string-utils"
import { BuildDeepWeldConstraints,
BuildWeldConstraints,
capitalizeFirstLetter,MasslessPart, 
OutlineHighlight} from "shared/common/util.helper";
import { A,
assets } from "shared/common/assets";
import { getConfig } from "./config.helper";
export type IHandBrake = Model & {
	RootPart: BasePart & {
		WeldConstraint: WeldConstraint
		Motor6D: Motor6D
	}
}
export function getRewardDisplay(reward: { type: string; value: number }): {
	countText: string;
	nameText: string;
	image_id?: string;
} {
	if (reward.type === "cash")
		return { countText: `$${reward.value}`, nameText: "Cash", image_id: A.icons.coin };
	if (reward.type === "revives")
		return { countText: `x${reward.value}`, nameText: "Revives" , image_id: A.icons.luck};
	if (reward.type === "flips")
		return { countText: `x${reward.value}`, nameText: "Flips", image_id:  A.icons.rebirth};
	return { countText: `${reward.value}`, nameText: capitalizeFirstLetter(reward.type) };
	// return { countText: `x${reward.value}`, nameText: reward.type };
}
export type CartRigMode = "simulated" | "preview"

/** Chassis forward from the authored FL/FR/RL/RR wheel names, falling back to the model's look vector. */
function resolveChassisForward(cart_model: ICart, bounding_box: CFrame): Vector3 {
	const wheels = cart_model.FindFirstChild("Wheels")
	const pivot = (name: string) => (wheels?.FindFirstChild(name) as Model | undefined)?.GetPivot().Position
	const [fl, fr, rl, rr] = [pivot("FL"), pivot("FR"), pivot("RL"), pivot("RR")]
	const up = bounding_box.UpVector
	if (fl && fr && rl && rr) {
		const raw = fl.add(fr).sub(rl).sub(rr)
		const flat = raw.sub(up.mul(raw.Dot(up)))
		if (flat.Magnitude > 0.1) {
			if (flat.Unit.Dot(bounding_box.LookVector) < 0.7) {
				warn(`[RigCartModel] ${cart_model.Name}: wheel layout forward differs from model look vector, using wheel layout`)
			}
			return flat.Unit
		}
	}
	return bounding_box.LookVector
}

/**
 * Builds the physical cart: a massive chassis ("Mass"), a massless "Root" carrying the drive
 * constraints, a VehicleSeat, and one sprung, frictionless "BALL" contact per wheel.
 * "preview" mode welds everything rigidly for display-only clones (garage, shop, death screen).
 */
export function RigCartModel(cart_model: ICart, mode: CartRigMode = "simulated") {
	const simulated = mode === "simulated"
	const visuals = cart_model.FindFirstChild("Visuals") as Model
	const sv = new Instance("StringValue", cart_model)
	sv.Name = "CartIdentifier"
	sv.Value = cart_model.Name.split("_")[0]
	const wheels = cart_model.Wheels
	const [bounding_box] = cart_model.GetBoundingBox()
	const forward = resolveChassisForward(cart_model, bounding_box)
	const chassis = CFrame.lookAt(bounding_box.Position, bounding_box.Position.add(forward), bounding_box.UpVector)

	// chassis mass, the only massive part in the chassis assembly (the wheel balls are their own assemblies)
	const mass_part = MasslessPart(cart_model, "Mass")
	mass_part.Size = new Vector3(2.712, 1, 2.475)
	mass_part.CFrame = bounding_box.mul(new CFrame(0, -0.5, 0))
	mass_part.Massless = false
	const volume = mass_part.Size.X * mass_part.Size.Y * mass_part.Size.Z
	mass_part.CustomPhysicalProperties = new PhysicalProperties(
		math.clamp(CART_TUNING.chassis.mass / volume, 0.01, 100),
		0.3,
		0
	)

	const hitbox = MasslessPart(cart_model, "Hitbox")
	const is_spike = StringUtils.startsWith(cart_model.Name, "Spiky Cart")
	hitbox.Size = new Vector3(4, 3.851, 5)
		.mul(is_spike ? new Vector3(0.7, 1, 0.7) : 1)
		.add(new Vector3(0, -2, 0))
	hitbox.CFrame = bounding_box.mul(new CFrame(0, 0.5, 0))
	hitbox.CanCollide = true
	hitbox.CollisionGroup = "Hitbox"
	hitbox.CustomPhysicalProperties = new PhysicalProperties(0.7, 1, 0.01)

	// Root keeps the model's own frame so authored offsets (honk, handbrake) stay put;
	// the "Drive" attachment carries the chassis frame (LookVector = forward)
	const root_part = MasslessPart(cart_model, "Root")
	root_part.CFrame = bounding_box
	root_part.Color = new Color3(0, 0.9, 1)
	const root_attachment = new Instance("Attachment", root_part)
	root_attachment.Name = "Root"
	const drive_attachment = new Instance("Attachment", root_part)
	drive_attachment.Name = "Drive"
	drive_attachment.WorldCFrame = chassis
	BuildWeldConstraints(root_part, hitbox)

	const seat = new Instance("VehicleSeat", cart_model)
	seat.Name = "VehicleSeat"
	seat.Size = new Vector3(4.278, 0.332, 5.622)
	seat.CFrame = chassis.mul(new CFrame(0, -0.5, 0))
	seat.Transparency = 1
	seat.CanCollide = false
	// input only: the controller reads ThrottleFloat/SteerFloat, the legacy seat motor stays off
	seat.MaxSpeed = 0
	seat.Torque = 0
	seat.TurnSpeed = 0
	seat.HeadsUpDisplay = false
	BuildWeldConstraints(root_part, seat)
	BuildWeldConstraints(root_part, mass_part)
	BuildDeepWeldConstraints(root_part, visuals)

	if (simulated) {
		const drive = new Instance("VectorForce")
		drive.Name = "DriveForce"
		drive.Attachment0 = root_attachment
		drive.RelativeTo = Enum.ActuatorRelativeTo.World
		drive.ApplyAtCenterOfMass = true
		drive.Force = Vector3.zero
		drive.Parent = root_part

		// yaw-only, so it never fights the suspension pitching over crests
		const steer = new Instance("Torque")
		steer.Name = "SteerTorque"
		steer.Attachment0 = root_attachment
		steer.RelativeTo = Enum.ActuatorRelativeTo.World
		steer.Torque = Vector3.zero
		steer.Parent = root_part

		// primary axis (X) of this attachment points along chassis up
		const upright_attachment = new Instance("Attachment", root_part)
		upright_attachment.Name = "UprightAxis"
		upright_attachment.CFrame = CFrame.fromMatrix(Vector3.zero, Vector3.yAxis, new Vector3(-1, 0, 0))
		const upright = new Instance("AlignOrientation")
		upright.Name = "Upright"
		upright.Mode = Enum.OrientationAlignmentMode.OneAttachment
		upright.AlignType = Enum.AlignType.PrimaryAxisParallel
		upright.PrimaryAxis = Vector3.yAxis
		upright.Attachment0 = upright_attachment
		upright.Responsiveness = CART_TUNING.air.uprightResponsiveness
		upright.MaxTorque = 0
		upright.Enabled = false
		upright.Parent = root_part
	}

	cart_model.PrimaryPart = root_part
	cart_model.GetDescendants().forEach((descendant) => {
		if (descendant.IsA("BasePart") && descendant.Name !== "Mass") {
			descendant.Massless = true
			if (descendant.IsDescendantOf(visuals) || descendant.IsDescendantOf(wheels)) {
				descendant.CanCollide = false
			}
		}
	})

	const wheel_models = wheels.GetChildren().filter((c): c is IWheel => c.IsA("Model"))
	const wheel_count = math.max(wheel_models.size(), 1)
	const susp = CART_TUNING.suspension
	const sprung_mass = CART_TUNING.chassis.mass / wheel_count
	const wheel_load = sprung_mass * Workspace.Gravity * CART_TUNING.chassis.gravityScale
	const stiffness = wheel_load / susp.sag
	const damping = 2 * susp.dampingRatio * math.sqrt(stiffness * sprung_mass)

	wheel_models.forEach((model) => {
		const wheel = model.FindFirstChild("WHEEL") as BasePart | undefined
		const connection = model.FindFirstChild("CONNECTION") as BasePart | undefined
		if (!wheel || !connection) return
		connection.Size = new Vector3(0.7, 0.5, 0.875)
		connection.CollisionGroup = "Wheels"

		// caster fork: Motor6D so the client can swivel it visually with steering
		const caster = new Instance("Motor6D")
		caster.Name = "Caster"
		caster.Part0 = root_part
		caster.Part1 = connection
		caster.C0 = root_part.CFrame.ToObjectSpace(connection.CFrame)
		caster.C1 = new CFrame()
		caster.Parent = connection

		const weld_wheel = new Instance("Weld", wheel)
		weld_wheel.Part0 = connection
		weld_wheel.Part1 = wheel
		weld_wheel.C0 = new CFrame(0, 0, connection.Size.Z / 2)

		// contact sphere at the wheel centre
		const rest_position = connection.Position.add(root_part.CFrame.UpVector.mul(CART_TUNING.wheel.mountOffsetY))
		const ball = new Instance("Part")
		ball.Name = "BALL"
		ball.Shape = Enum.PartType.Ball
		ball.Size = Vector3.one.mul(CART_TUNING.wheel.radius * 2)
		ball.CFrame = root_part.CFrame.Rotation.add(rest_position)
		ball.Transparency = 1
		ball.Color = new Color3(1, 0, 0)
		ball.CanCollide = simulated
		ball.CollisionGroup = "Wheels"
		ball.Anchored = false
		// frictionless contact: grip, drive and braking are handled by the controller
		const ball_volume = (4 / 3) * math.pi * math.pow(CART_TUNING.wheel.radius, 3)
		ball.CustomPhysicalProperties = new PhysicalProperties(
			math.clamp(CART_TUNING.wheel.mass / ball_volume, 0.01, 100),
			0,
			0,
			100,
			100
		)
		ball.Massless = !simulated
		ball.Parent = model
		ball.Destroying.Once(() => wheel.Destroy())
		wheel.Destroying.Once(() => ball.Destroy())

		if (!simulated) {
			BuildWeldConstraints(root_part, ball)
			return
		}
		// prismatic slider along chassis down (attachment X axis), positive = extension
		const local_rest = root_part.CFrame.PointToObjectSpace(rest_position)
		const mount = new Instance("Attachment", root_part)
		mount.Name = `${model.Name}_mount`
		mount.CFrame = CFrame.fromMatrix(local_rest, new Vector3(0, -1, 0), new Vector3(1, 0, 0))
		const hub = new Instance("Attachment", ball)
		hub.Name = "hub"
		hub.WorldCFrame = mount.WorldCFrame
		const top = new Instance("Attachment", root_part)
		top.Name = `${model.Name}_spring_top`
		top.Position = local_rest.add(new Vector3(0, susp.springLength, 0))

		const slider = new Instance("PrismaticConstraint")
		slider.Attachment0 = mount
		slider.Attachment1 = hub
		slider.LimitsEnabled = true
		slider.LowerLimit = -susp.travelUp
		slider.UpperLimit = susp.travelDown
		slider.Restitution = 0
		slider.Parent = ball

		const spring = new Instance("SpringConstraint")
		spring.Attachment0 = top
		spring.Attachment1 = hub
		spring.FreeLength = susp.springLength + susp.sag
		spring.Stiffness = stiffness
		spring.Damping = damping
		spring.Visible = false
		spring.Parent = ball
	})

	const __hand_brake = assets.FindFirstChild("HandBrake") as IHandBrake
	assert(__hand_brake, "HandBrake model not found in assets")
	const hand_brake_clone = __hand_brake.Clone()
	hand_brake_clone.GetDescendants().forEach((descendant) => {
		if (descendant.IsA("BasePart")) {
			descendant.CanCollide = false
			descendant.Massless = true
			descendant.Anchored = false
		}
	})
	hand_brake_clone.Name = "HandBrake"
	hand_brake_clone.Parent = cart_model
	hand_brake_clone.RootPart.WeldConstraint.Destroy()
	const motor6d = new Instance("Motor6D", hand_brake_clone.RootPart)
	motor6d.Name = "Motor6D"
	motor6d.Part0 = hand_brake_clone.RootPart
	motor6d.Part1 = cart_model.PrimaryPart
	motor6d.C0 = new CFrame()
	motor6d.MaxVelocity = 0.025
	motor6d.C1 = new CFrame(1.9, 0, 0.7).mul(CFrame.Angles(0, math.rad(90), 0))

	const honk = assets.FindFirstChild("Honk") as IHonk | undefined
	if (honk) {
		const honk_clone = honk.Clone()
		honk_clone.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.CanCollide = false
				descendant.Massless = true
				descendant.Anchored = false
			}
		})
		honk_clone.Name = "Honk"
		honk_clone.Parent = cart_model
		const honk_motor = new Instance("Motor6D", honk_clone.HonkRoot)
		honk_motor.Name = "Motor6D"
		honk_motor.Part0 = honk_clone.HonkRoot
		honk_motor.Part1 = cart_model.PrimaryPart
		honk_motor.C0 = new CFrame()
		honk_motor.C1 = new CFrame(1, 2, -2.3).mul(CFrame.Angles(0, math.rad(-90), 0))
	}
	OutlineHighlight(cart_model)
}
type IHonk = Model & {
	HonkBase: BasePart
	HonkRoot: BasePart
}
export const getPreviousBigCheckpoint = (current: number) => {
	let found
	let i = current
	while (!found && i > 0) {
		const checkpoint = getCheckpointModelByIndex(i)
		if (!checkpoint) {
			return 0
		}
		if (checkpoint.FindFirstChild("Spawn")) {
			found = i
		}
		i -= 1
	}
	return found || 0
}
export function getCheckpointModelByIndex(index: number): Model | undefined {
	const checkpoints = Workspace.FindFirstChild("Checkpoints") as Folder
	return checkpoints
		.GetChildren()
		.find((child) => child.Name === tostring(index)) as Model | undefined
}
export const getNextBigCheckpoint = (current: number) => {
	let found
	let i = current
	while (!found) {
		i += 1
		const checkpoint = getCheckpointModelByIndex(i)
		if (!checkpoint) {
			return current
		}
		if (checkpoint.FindFirstChild("Spawn")) {
			found = i
		}
	}
	return found
}

export const getNextSmallCheckpoint = (current: number) => {
	let i = current
	while (true) {
		i += 1
		const checkpoint = getCheckpointModelByIndex(i)
		if (!checkpoint) {
			return undefined
		}
		// Small checkpoints don't have "Spawn" child
		if (!checkpoint.FindFirstChild("Spawn")) {
			return checkpoint
		}
	}
}
export function getCheckpointDataFromIndex(index: number) {
	const config = ISLAND_CONFIG[`${index}` as keyof typeof ISLAND_CONFIG]
	if (!config) {
		return
	}
	return config
}
export const ISLAND_CONFIG = {
	"0": {
		name: "Sunny Island",
		image: A.backgrounds.initial
	},
	"2": {
		name: "Snowy Hills",
		image: A.backgrounds.post_initial
	},
	"4": {
		name: "Core",
		image: A.backgrounds.post_snowy
	},
	"6": {
		name: "Sands of Trial",
		image: A.backgrounds.post_magma
	},
	"9": {
		name: "Pastel Paradise",
		image: A.backgrounds.desert
	},
	"11": {
		name: "Void",
		image: A.backgrounds.cloud
	}
}

const out_id = "rbxassetid://112110619324038"
const in_id = "rbxassetid://108818865060170"

export type CartAnimatorModel = Model & {
	MovePart: BasePart
	StandPart: BasePart
	AnimationController: AnimationController & {
		Animator: Animator
	}
}

/** The garage preview's animator rig in the place (looked up when needed, not when this module is required). */
export function getCartAnimator(): CartAnimatorModel | undefined {
	return Workspace.FindFirstChild("GaragePreview")?.FindFirstChild("CartAnimator") as CartAnimatorModel | undefined
}

export interface GarageTracks {
	anim_in: AnimationTrack
	anim_out: AnimationTrack
}

/**
 * Loads the garage in/out tracks on the CartAnimator (what this module used to do when it was required). The client's
 * GarageController keeps one pair per generation in its trove.
 */
export function loadGarageTracks(): GarageTracks {
	const CartAnimator = getCartAnimator()
	assert(CartAnimator, "CartAnimator model not found in workspace.CartPreviewAttachment")
	assert(CartAnimator.AnimationController, "CartAnimator.AnimationController not found")
	const Animator = CartAnimator.AnimationController.Animator as Animator
	assert(Animator, "CartAnimator.AnimationController.Animator not found")
	Animator.GetPlayingAnimationTracks().forEach((track) => {
		track.Stop()
		track.Destroy()
	})
	Animator.GetPlayingAnimationTracks().forEach((track) => {
		track.Destroy()
	})
	const animation_in = new Instance("Animation")
	animation_in.AnimationId = in_id
	const animation_out = new Instance("Animation")
	animation_out.AnimationId = out_id
	return { anim_in: Animator.LoadAnimation(animation_in), anim_out: Animator.LoadAnimation(animation_out) }
}

export function AnimateGarageMovement(
	model: ICart,
	direction: "in" | "out",
	tracks: GarageTracks
) {
	const { anim_in, anim_out } = tracks
	const pp = model.FindFirstChild("Root") as BasePart
	if (!pp) {
		return
	}
	const weld = new Instance("Weld", pp)
	const CartAnimator = getCartAnimator()
	assert(
		CartAnimator,
		"CartAnimator model not found in workspace.CartPreviewAttachment"
	)
	model.Parent = Workspace.CurrentCamera
	const [_, bbox] = model.GetBoundingBox()
	model.PivotTo(CartAnimator.MovePart.CFrame.mul(new CFrame(0, bbox.Y / 2, 0)))
	weld.Part0 = CartAnimator.MovePart
	weld.Part1 = pp
	weld.C0 = new CFrame(0, 0, 0)
	const size_y = bbox.Y
	weld.C1 = new CFrame(0, -size_y / 2, 0)
	if (direction === "in") {
		anim_out.Stop()
		anim_in.Play()
	} else {
		anim_in.Stop()
		anim_out.Play()
	}
}
export function BrickifyModel(
	model: Model,
	direction: "in" | "out",
	duration = 0.5,
	style = Enum.EasingStyle.Quad
) {
	const parts = model
		.GetDescendants()
		.filter((_) => _.IsA("BasePart")) as BasePart[]
	const pivot = model.GetPivot()
	return parts.map((part, index) => {
		// const weld = part.FindFirstChildOfClass("Weld") as Weld | undefined
		// weld?.Destroy()
		// const weld_constraints = part.FindFirstChildOfClass("WeldConstraint") as WeldConstraint | undefined
		// weld_constraints?.Destroy()
		const ancestor_model = part.FindFirstAncestorOfClass("Model") as Model
		if (ancestor_model === model) {
			return
		}

		const original_transparency = part.Transparency
		if (direction === "in") {
			part.Transparency = 1
		}
		if (["BALL", "RootPart", "G2"].includes(part.Name)) {
			part.Anchored = false
			if (direction === "out") {
				part.Destroy()
			}
			const tween = TweenService.Create(
				part,
				new TweenInfo(
					duration,
					style,
					// direction === "in" ? Enum.EasingDirection.Out :
					Enum.EasingDirection.Out,
					0,
					false,
					math.clamp(
						direction === "in" ? 0.01 * 3 * 10 : 0.005 * index,
						0.01,
						0.5
					)
				),
				{
					Transparency: direction === "out" ? 1 : original_transparency
				}
			)
			tween.Play()
			return
		} else {
			part.Anchored = true
		}
		// const ball_socket = part.FindFirstChildOfClass("BallSocketConstraint") as
		// 	| BallSocketConstraint
		// 	| undefined
		// // ball_socket?.Destroy()
		// const hinge = part.FindFirstChildOfClass("HingeConstraint") as
		// 	| HingeConstraint
		// 	| undefined
		// // hinge?.Destroy()
		// const motor6d = part.FindFirstChildOfClass("Motor6D") as Motor6D | undefined
		// if (motor6d || hinge || ball_socket) {
		// 	part.Anchored = false
		// 	return
		// } else {
		// 	part.Anchored = true
		// }
		// motor6d?.Destroy()
		const original_cframe = part.CFrame
		const [root_cframe, bounding_box] = model.GetBoundingBox()
		const y =
			original_cframe.Position.Y - (root_cframe.Position.Y - bounding_box.Y / 2)

		const spawn_cframe = pivot.mul(
			new CFrame(direction === "in" ? 5 : 0, 5, direction === "in" ? 10 : -10)
		)
		if (direction === "in") {
			part.CFrame = spawn_cframe
		}
		const tween = TweenService.Create(
			part,
			new TweenInfo(
				duration,
				style,
				// direction === "in" ? Enum.EasingDirection.Out :
				Enum.EasingDirection.Out,
				0,
				false,
				math.clamp(
					direction === "in" ? 0.01 * y * 10 : 0.005 * index,
					0.01,
					0.5
				)
			),
			{
				CFrame: direction === "in" ? original_cframe : spawn_cframe,
				Transparency: direction === "out" ? 1 : original_transparency
			}
		)
		tween.Play()
		return {
			part,
			original_cframe,
			original_transparency,
			tween
		}
	})
}

export function getCartConfig(cart_name: string) {
	return getConfig().CartConfig.find((e)=>e.name === cart_name)
}
type ICartHorn = Model & {
	HornBase: BasePart
	HornRoot: BasePart
}