import { Workspace } from "@rbxts/services"
import { CART_TUNING } from "./cart.tuning"

export type WheelContact = {
	/** wheels currently touching something drivable */
	contacts: number
	/** average ground normal under the touching wheels (chassis up when airborne) */
	normal: Vector3
}

export function buildCartRaycastParams(ignore: Instance[]): RaycastParams {
	const params = new RaycastParams()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = ignore
	params.IgnoreWater = true
	// only hit what the wheels would actually collide with
	params.CollisionGroup = "Wheels"
	params.RespectCanCollide = true
	return params
}

/** Casts one ray per remaining wheel along -chassisUp. */
export function probeWheels(
	wheels: BasePart[],
	chassis_up: Vector3,
	params: RaycastParams
): WheelContact {
	const reach = CART_TUNING.wheel.radius + CART_TUNING.suspension.probeMargin
	let contacts = 0
	let normal_sum = Vector3.zero
	for (const ball of wheels) {
		if (!ball.Parent) continue
		const hit = Workspace.Raycast(ball.Position, chassis_up.mul(-reach), params)
		if (hit) {
			contacts += 1
			normal_sum = normal_sum.add(hit.Normal)
		}
	}
	return {
		contacts,
		normal: contacts > 0 ? normal_sum.Unit : chassis_up
	}
}

export function getTiltAngle(root: BasePart): number {
	return math.acos(math.clamp(root.CFrame.UpVector.Dot(Vector3.yAxis), -1, 1))
}

/**
 * Whether the cart is somewhere sensible to respawn: upright, on the ground, with solid
 * ground under all four corners and not on an AntiRevive surface.
 */
export function isSafeRestPose(root: BasePart, params: RaycastParams): boolean {
	const cfg = CART_TUNING.restPose
	if (getTiltAngle(root) > math.rad(cfg.maxTiltDeg)) return false
	const down = new Vector3(0, -1, 0)
	const centre = Workspace.Raycast(root.Position, down.mul(cfg.maxGroundGap), params)
	if (!centre || centre.Instance.Name === cfg.antiReviveName) return false
	const half_x = root.Size.X / 2 + cfg.cornerDeadZone
	const half_z = root.Size.Z / 2 + cfg.cornerDeadZone
	const corners = [
		new Vector3(half_x, 0, half_z),
		new Vector3(-half_x, 0, half_z),
		new Vector3(half_x, 0, -half_z),
		new Vector3(-half_x, 0, -half_z)
	]
	for (const corner of corners) {
		const hit = Workspace.Raycast(root.Position.add(corner), down.mul(cfg.cornerProbeDepth), params)
		if (!hit || hit.Instance.Name === cfg.antiReviveName) return false
	}
	return true
}

export function getWheelBalls(cart: Model): BasePart[] {
	const wheels = cart.FindFirstChild("Wheels")
	if (!wheels) return []
	return wheels
		.GetDescendants()
		.filter((d): d is BasePart => d.IsA("BasePart") && d.Name === "BALL")
}

/**
 * Mass the cart's actuators push: the chassis assembly (the "Mass" part) plus the wheel balls still attached. The
 * balls hang on prismatic sliders, so they are separate assemblies that the chassis drags along.
 */
export function getCartMass(root: BasePart, wheels: BasePart[]): number {
	let mass = root.AssemblyMass
	for (const ball of wheels) {
		if (ball.Parent && ball.AssemblyRootPart !== root.AssemblyRootPart) mass += ball.AssemblyMass
	}
	return mass
}

/**
 * Yaw inertia of the cart about `axis` through the chassis centre of mass: the chassis box plus each attached wheel
 * ball as a point mass (the sliders lock the balls' rotation to the chassis, so they turn with it).
 */
export function getCartYawInertia(root: BasePart, wheels: BasePart[], chassis_inertia_per_mass: number, axis: Vector3): number {
	const centre = root.AssemblyCenterOfMass
	let inertia = root.AssemblyMass * chassis_inertia_per_mass
	for (const ball of wheels) {
		if (!ball.Parent || ball.AssemblyRootPart === root.AssemblyRootPart) continue
		const offset = ball.Position.sub(centre)
		const perpendicular = offset.sub(axis.mul(offset.Dot(axis)))
		inertia += ball.AssemblyMass * perpendicular.Dot(perpendicular)
	}
	return inertia
}

/**
 * Makes a character's parts massless and puts them in the "Players" collision group (no collisions with wheel balls,
 * hitboxes or other players). Called on spawn and again when the character sits in a cart, for parts added since.
 */
export function prepareRiderBody(char: Model) {
	char.GetDescendants().forEach((descendant) => {
		if (descendant.IsA("BasePart")) {
			descendant.Massless = true
			descendant.CollisionGroup = "Players"
		}
	})
	char.SetAttribute("CartRiderBody", true)
}
