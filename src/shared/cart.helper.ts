import { TweenService, Workspace } from "@rbxts/services"
import { A, assets } from "./assets"
import { __IS_STUDIO__, getConfig } from "./config.helper"
import { ICart, IWheel } from "./type.helper"
import {
	BuildDeepWeldConstraints,
	BuildWeldConstraints,
	capitalizeFirstLetter,
	MasslessPart,
	OutlineHighlight
} from "./util.helper"
import StringUtils from "@rbxts/string-utils"
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
export function RigCartModel(cart_model: ICart) {
	const visuals = cart_model.FindFirstChild("Visuals") as Model
	// logger.log(`Initializing cart: ${cart_model.GetFullName()}`)
	const sv = new Instance("StringValue", cart_model)
	sv.Name = "CartIdentifier"
	sv.Value = cart_model.Name.split("_")[0]
	// build required parts
	const wheels = cart_model.Wheels
	const [bounding_box, _] = cart_model.GetBoundingBox()
	const mass_part = MasslessPart(cart_model, "Mass")
	mass_part.Size = new Vector3(2.712, 1, 2.475)
	mass_part.CFrame = bounding_box.mul(new CFrame(0, -0.5, 0))
	mass_part.Massless = false
	const hitbox = MasslessPart(cart_model, "Hitbox")
	const is_spike = StringUtils.startsWith(cart_model.Name, "Spiky Cart")
	hitbox.Size = new Vector3(4, 3.851, 5)
		.mul(is_spike ? new Vector3(0.7, 1, 0.7) : 1)
		.add(new Vector3(0, -2, 0))
	hitbox.CFrame = bounding_box.mul(new CFrame(0, 0.5, 0))
	hitbox.CanCollide = true
	hitbox.CollisionGroup = "Hitbox"
	hitbox.CustomPhysicalProperties = new PhysicalProperties(0.7, 1, 0.01)
	const root_part = MasslessPart(cart_model, "Root")
	root_part.CFrame = bounding_box
	root_part.Color = new Color3(0, 0.9, 1)
	const vector_force = new Instance("VectorForce", root_part)
	vector_force.Force = new Vector3(0, 0, 0)
	vector_force.Attachment0 = new Instance("Attachment", root_part)
	vector_force.Attachment0.Name = "Root"
	vector_force.RelativeTo = Enum.ActuatorRelativeTo.World
	BuildWeldConstraints(root_part, hitbox)
	// build vehicle seat
	const seat = new Instance("Seat", cart_model)
	seat.Name = "VehicleSeat"
	seat.Size = new Vector3(4.278, 0.332, 5.622)
	seat.CFrame = bounding_box.mul(new CFrame(0, -0.5, 0))
	seat.Transparency = 1
	seat.CanCollide = false
	BuildWeldConstraints(root_part, seat)
	BuildWeldConstraints(root_part, mass_part)
	BuildDeepWeldConstraints(root_part, visuals)
	// build balls

	cart_model.Wheels.GetChildren().forEach((_) => {
		if (!_.IsA("Model")) return
		const model = _ as IWheel
		const ball = MasslessPart(model, `BALL`)
		ball.Shape = Enum.PartType.Ball
		ball.CFrame = model.GetPivot()
		ball.CanCollide = true
		ball.Transparency = 1
		const wheel = model.FindFirstChild("WHEEL")
		if (!wheel) return
		ball.Destroying.Once(() => {
			wheel?.Destroy()
		})
		wheel.Destroying.Once(() => {
			ball?.Destroy()
		})
		// logger.log(`Built ball for wheel: ${model.GetFullName()}`)
	})
	cart_model.PrimaryPart = root_part
	// cart physics and stuff
	cart_model.GetDescendants().forEach((descendant) => {
		if (descendant.IsA("BasePart") && descendant.Name !== "Mass") {
			descendant.Massless = true
			if (
				descendant.IsDescendantOf(visuals) ||
				(descendant.IsDescendantOf(wheels) && descendant.Name !== "BALL")
			) {
				descendant.CanCollide = false
			}
		}
	})
	// handle wheels
	wheels.GetChildren().forEach((_) => {
		if (!_.IsA("Model")) return
		const model = _ as IWheel
		const wheel = model.FindFirstChild("WHEEL") as Part | undefined
		if (!wheel) return
		const connection = model.CONNECTION
		connection.Size = new Vector3(0.7, 0.5, 0.875)
		const ball = model.BALL
		const attachment_ball = new Instance("Attachment", ball)
		const attachment_connection = new Instance("Attachment", root_part)
		attachment_connection.WorldPosition = connection.Position
		// .add(
		// new Vector3(0, 0, connection.Size.Z / 2)
		// )
		ball.Color = new Color3(1, 0, 0)
		attachment_ball.Name = "ball->connection"
		attachment_connection.Name = "connection->ball"
		const attachment_root_to_ball = new Instance("Attachment", cart_model.Root)
		attachment_root_to_ball.WorldPosition = connection.Position
		attachment_root_to_ball.Orientation = new Vector3(0, 0, 90)
		attachment_root_to_ball.Name = "root->ball"
		const attachment_connector_to_root = new Instance("Attachment", connection)
		attachment_connector_to_root.Name = "connection->root"
		attachment_connector_to_root.WorldCFrame = connection.CFrame
		attachment_connector_to_root.Orientation = new Vector3(0, 90, 0)
		// connector

		const hinge_constraint = new Instance("HingeConstraint", connection)
		hinge_constraint.Attachment1 = attachment_connector_to_root
		hinge_constraint.Attachment0 = attachment_root_to_ball

		// ball
		// const weld_constraints = new Instance("WeldConstraint", ball)
		// weld_constraints.Part0 = connection
		// weld_constraints.Part1 = ball
		// ball.Position = connection.Position.sub(new Vector3(0, connection.Size.Y / 2 + ball.Size.Y/2, 0))

		const ballsocket = new Instance("BallSocketConstraint", ball)
		ballsocket.Attachment0 = attachment_connection
		ballsocket.Attachment1 = attachment_ball
		ballsocket.MaxFrictionTorque = 30
		// wheel
		const weld_wheel = new Instance("Weld", wheel)
		weld_wheel.Part1 = wheel
		weld_wheel.Part0 = connection
		weld_wheel.C0 = new CFrame(0, 0, connection.Size.Z / 2)
		attachment_connection.Position = attachment_connection.Position.add(
			new Vector3(0, -0.4, 0)
		)

		// const following_mass = new Instance("Part", wheel)
		// following_mass.Name = "Mass"
		// following_mass.Size = new Vector3(1, 1, 1)
		// following_mass.Transparency = 1
		// following_mass.CanCollide = false
		// following_mass.Massless = true

		// const align_orientation = new Instance("AlignOrientation", connection)
		// const wheel_att = new Instance("Attachment", connection)
		// align_orientation.Mode = Enum.OrientationAlignmentMode.OneAttachment
		// align_orientation.Attachment0 = wheel_att
		// wheel_att.Name = "AlignOrientationAttachment"
		// wheel_att.Orientation = new Vector3(0, 90, 0)
		// align_orientation.AlignType = Enum.AlignType.PrimaryAxisLookAt

		// const weld_mass = new Instance("Weld", following_mass)
		// weld_mass.Part0 = wheel
		// weld_mass.Part1 = following_mass
		// weld_mass.C0 = new CFrame(.3, 0, 0)
		// 	.mul(CFrame.Angles(math.rad(90), 0, 0))
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
		name: "Void",
		image: A.backgrounds.post_magma
	}
}

const out_id = "rbxassetid://112110619324038"
const in_id = "rbxassetid://108818865060170"
const animation_in = new Instance("Animation")
animation_in.AnimationId = in_id
const animation_out = new Instance("Animation")
animation_out.AnimationId = out_id
const garage_preview = Workspace.FindFirstChild("GaragePreview")
export const CartAnimator = garage_preview?.FindFirstChild("CartAnimator") as
	| (Model & {
			MovePart: BasePart
			StandPart: BasePart
			AnimationController: AnimationController & {
				Animator: Animator
			}
	  })
	| undefined
assert(
	CartAnimator,
	"CartAnimator model not found in workspace.CartPreviewAttachment"
)
assert(
	CartAnimator.AnimationController,
	"CartAnimator.AnimationController not found"
)
const Animator = CartAnimator.AnimationController.Animator as Animator
assert(Animator, "CartAnimator.AnimationController.Animator not found")
Animator.GetPlayingAnimationTracks().forEach((track) => {
	track.Stop()
	track.Destroy()
})
Animator.GetPlayingAnimationTracks().forEach((track) => {
	track.Destroy()
})
const anim_in = Animator.LoadAnimation(animation_in)
const anim_out = Animator.LoadAnimation(animation_out)
export function AnimateGarageMovement(
	model: ICart,
	direction: "in" | "out" = "in"
) {
	const pp = model.FindFirstChild("Root") as BasePart
	if (!pp) {
		return
	}
	const weld = new Instance("Weld", pp)
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