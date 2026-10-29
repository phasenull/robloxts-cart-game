import { getConfig } from "./config.helper"
import { ICartEntry } from "./type.helper"

/**
 * Every cart tunable lives here. Units are studs, seconds and studs/s unless noted.
 * Accelerations are mass-independent (studs/s²); forces are derived from AssemblyMass at runtime.
 */
export const CART_TUNING = {
	chassis: {
		/** mass of the hidden "Mass" part; every other cart part (and the rider) is massless */
		mass: 40,
		/** < 1 makes the cart a bit floatier in the air than the world; 1 = real gravity */
		gravityScale: 0.85,
		/** riding below this Y counts as falling off the map */
		fallKillY: -260
	},
	/** per-cart stats are derived from CartConfig's `power` and `friction` */
	stats: {
		topSpeedBase: 18,
		topSpeedPerPower: 0.2,
		topSpeedMin: 24,
		topSpeedMax: 80,
		/** launch acceleration = topSpeed * this, so every cart reaches ~95% top speed in the same ~2.7s */
		accelPerTopSpeed: 1.1,
		brakeBase: 30,
		brakePerFriction: 1.2,
		brakeMax: 110
	},
	drive: {
		/** reverse top speed and acceleration as a fraction of the forward ones */
		reverseSpeedFactor: 0.4,
		reverseAccelFactor: 0.6,
		/** below this forward speed, holding S/down reverses instead of braking */
		reverseThreshold: 2,
		/** deceleration while coasting on the ground (keeps momentum, still stops eventually) */
		rollingResistance: 3,
		/** with no throttle and below this speed, the cart holds still on slopes up to holdMaxSlopeDeg */
		holdSpeed: 1.5,
		holdMaxSlopeDeg: 20,
		/** aerodynamic drag, decel = k * speed² */
		quadraticDrag: 0.0012,
		/** gravity can carry you past topSpeed downhill, up to topSpeed * overspeedFactor */
		overspeedFactor: 2.2,
		/** how hard the limiter pulls back above that, per second of excess speed */
		overspeedDamping: 1.5,
		/** input smoothing, in full-scale units per second */
		throttleRiseRate: 4,
		throttleFallRate: 6
	},
	steering: {
		/** yaw rate at full lock (rad/s) */
		maxYawRate: 2.4,
		/** fraction of steering available at standstill, so you can always line yourself up */
		minSteerFactor: 0.35,
		/** speed at which full steering becomes available */
		fullSteerSpeed: 8,
		/** steering fraction left at top speed, keeps high speed stable */
		highSpeedSteerFactor: 0.55,
		steerRate: 6,
		/** seconds for the yaw rate to close ~63% of the gap to the target */
		yawResponseTime: 0.08,
		/** yaw torque budget, multiplied by assembly mass */
		torquePerMass: 160,
		handbrakeSteerBoost: 1.35,
		/** front casters turn this far (visual only) */
		visualCasterAngleDeg: 28
	},
	grip: {
		/** how fast sideways slip is cancelled (1/s) */
		response: 10,
		/** max cornering acceleration before the cart starts to slide */
		maxLateralAccel: 110,
		/** grip multiplier while the handbrake is held: drift! */
		handbrakeGripFactor: 0.25
	},
	handbrake: {
		/** handbrake decel = the cart's brake decel * this */
		decelFactor: 1.2
	},
	suspension: {
		/** spring sits this far compressed when the cart is at rest */
		sag: 0.18,
		travelUp: 0.35,
		travelDown: 0.45,
		dampingRatio: 0.45,
		springLength: 1.5,
		/** extra ray length beyond the wheel radius that still counts as "on the ground" */
		probeMargin: 0.5
	},
	wheel: {
		/** BALL contact sphere radius */
		radius: 0.5,
		/** wheel centre relative to the authored CONNECTION part, along chassis up */
		mountOffsetY: -0.4,
		density: 0.5
	},
	air: {
		/** soft self-righting torque while airborne or tipping, multiplied by assembly mass */
		uprightTorquePerMass: 60,
		uprightResponsiveness: 6,
		/** seconds off the ground before self-righting kicks in */
		uprightDelay: 0.15
	},
	flip: {
		lift: 5,
		duration: 1,
		cooldown: 1,
		responsiveness: 20
	},
	feel: {
		baseFov: 70,
		maxFovBoost: 14,
		fovLerpRate: 4,
		brakeParticleMinSpeed: 4,
		/** sideways speed that counts as a drift (enables tyre smoke) */
		driftSlipSpeed: 6
	},
	/** "safe to revive here" checks, shared by client (death preview) and server (authority) */
	restPose: {
		maxTiltDeg: 3,
		maxGroundGap: 5,
		cornerDeadZone: 3,
		cornerProbeDepth: 9,
		antiReviveName: "AntiRevive",
		sampleInterval: 0.25
	},
	seat: {
		weldC0: new CFrame(0.1, 0.3, 0.15)
	},
	server: {
		sampleInterval: 0.25,
		/** horizontal speed allowed = max(floor, topSpeed * factor); covers downhill runs and punches */
		hardSpeedFloor: 160,
		hardSpeedFactor: 3,
		/** seconds over the limit before the server steps in */
		overspeedGrace: 1,
		/** extra studs per sample on top of the allowed speed before a move counts as a teleport */
		teleportMargin: 25,
		/** seconds the server keeps network ownership after correcting a cart */
		ownershipPenalty: 0.75,
		/** a client revive target must be this close to the server's last safe pose */
		reviveTolerance: 30
	},
	animations: {
		lever: 125184894660712,
		spawn: 95061387311577,
		idle: 126006910637391
	}
}

export type CartStats = {
	topSpeed: number
	acceleration: number
	brakeDecel: number
	reverseTopSpeed: number
	reverseAcceleration: number
	handbrakeDecel: number
}

const FALLBACK_CART = "Cart"

function findCartEntry(name: string): ICartEntry | undefined {
	return getConfig().CartConfig.find((e) => e.name === name)
}

/** Deterministic per-cart stats, computed identically on server and client from the shared config. */
export function resolveCartStats(descriptor: string): CartStats {
	const entry = findCartEntry(descriptor) ?? findCartEntry(FALLBACK_CART)
	const power = entry?.power ?? 100
	const friction = entry?.friction ?? 1
	const s = CART_TUNING.stats
	const topSpeed = math.clamp(s.topSpeedBase + power * s.topSpeedPerPower, s.topSpeedMin, s.topSpeedMax)
	const brakeDecel = math.clamp(s.brakeBase + friction * s.brakePerFriction, s.brakeBase, s.brakeMax)
	const acceleration = topSpeed * s.accelPerTopSpeed
	return {
		topSpeed,
		acceleration,
		brakeDecel,
		reverseTopSpeed: topSpeed * CART_TUNING.drive.reverseSpeedFactor,
		reverseAcceleration: acceleration * CART_TUNING.drive.reverseAccelFactor,
		handbrakeDecel: brakeDecel * CART_TUNING.handbrake.decelFactor
	}
}

export function getCartDescriptor(cart: Model): string {
	const identifier = cart.FindFirstChild("CartIdentifier") as StringValue | undefined
	return identifier?.Value ?? cart.Name.split("_")[0]
}

/** Horizontal speed above which the server corrects a cart. */
export function getServerSpeedLimit(stats: CartStats): number {
	const s = CART_TUNING.server
	return math.max(s.hardSpeedFloor, stats.topSpeed * s.hardSpeedFactor)
}
