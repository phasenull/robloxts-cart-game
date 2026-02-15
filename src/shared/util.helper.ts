import { TweenService } from "@rbxts/services"
import { __IS_STUDIO__ } from "./config.helper"

export function formatDate(seconds: number, ignore_day = false): string {
	const days = math.floor(seconds / 86400)
	seconds -= days * 86400
	const hours = math.floor(seconds / 3600)
	seconds -= hours * 3600
	const minutes = math.floor(seconds / 60)
	seconds -= minutes * 60
	const secs = math.floor(seconds)
	return `${ignore_day ? "" : `${days}d `}${hours}h ${minutes}m`
}
export function capitalizeFirstLetter(str: string): string {
	return str.sub(0, 1).upper() + str.sub(2)
}

export function extractMessageFromError(err: string): string {
	const filterer = '.out"]:131:'
	const [head, tail] = err.split(filterer)
	if (tail) {
		return tail
	}
	return "An unknown error occurred."
}

export function arrayOf<T>(n: number, val: T): T[] {
	if (n <= 0) {
		return []
	}
	const arr = []
	for (let i = 0; i < n; i++) {
		arr.push(val)
	}
	return arr
}
export function buildFontAssetId(font_name:string) {
	return `rbxasset://fonts/families/${font_name || Enum.Font.FredokaOne.Name}.json`
}
export function normalizeVector3(vec: Vector3,by: number = 1): Vector3 {
	const mag = vec.Magnitude
	if (mag === 0) {
		return new Vector3()
	}
	return vec.div(mag).mul(by)
}
const a : BasePart = undefined as unknown as BasePart
export function calculateSteepDiffFromHumanoid(humanoid: Humanoid): number {
	assert(humanoid?.RootPart, "Humanoid has no RootPart")
	const walk_direction = humanoid.MoveDirection
	const character = humanoid.RootPart.Parent as Model
	assert(character, "Could not find character model from humanoid")
	const root_cframe = humanoid.RootPart.CFrame
	const forward_vector = root_cframe.LookVector
	const right_vector = root_cframe.RightVector
	const forward_dot = forward_vector.Dot(walk_direction)
	const right_dot = right_vector.Dot(walk_direction)
	const angle = math.atan2(right_dot, forward_dot)
	return math.deg(angle)
}
export function MasslessPart(parent:Instance,name:string) {
	const part = new Instance("Part", parent)
	part.Size = new Vector3(1, 1, 1)
	part.Name = name
	part.Transparency = 1
	part.CanCollide = false
	part.Massless = true
	return part
} 
export function BuildWeldConstraints(part0: BasePart, part1: BasePart) {
	const weld = new Instance("WeldConstraint")
	weld.Part0 = part0
	weld.Part1 = part1
	part1.Anchored = false
	weld.Parent = part1
	weld.Name = `${part0.Name}->${part1.Name}`
	return weld
}
export function TweenValue(info: TweenInfo, callback: (alpha: number) => void) {
	const new_value = new Instance("NumberValue")
	new_value.Value = 0
	const tween = TweenService.Create(
		new_value,
		info,
		{ Value: 1 },
	)
	tween.Play()
	const connection = new_value.Changed.Connect(() => {
		callback(new_value.Value)
	})
	tween.Completed.Connect(() => {
		connection.Disconnect()
		new_value.Destroy()
	})
	return tween
}
export function BuildDeepWeldConstraints(part0: BasePart, part1: BasePart|Model) {
	if (part1.IsA("BasePart")) {
		BuildWeldConstraints(part0, part1)
	}
	part1.GetDescendants().forEach((descendant) => {
		if (descendant.IsA("BasePart")) {
			BuildWeldConstraints(part0, descendant)
		}
	})
}

export function formatCash(cash: number): string {
	if (cash < 1000) {
		return `$ ${cash}`;
	}
	
	const suffixes = [
		{ threshold: 1e42, divisor: 1e41, suffix: "Td" }, // Tredecillions
		{ threshold: 1e39, divisor: 1e38, suffix: "Dd" }, // Duodecillions
		{ threshold: 1e36, divisor: 1e35, suffix: "Ud" }, // Undecillions
		{ threshold: 1e33, divisor: 1e32, suffix: "Dc" }, // Decillions
		{ threshold: 1e30, divisor: 1e29, suffix: "No" }, // Nonillions
		{ threshold: 1e27, divisor: 1e26, suffix: "Oc" }, // Octillions
		{ threshold: 1e24, divisor: 1e23, suffix: "Sp" }, // Septillions
		{ threshold: 1e21, divisor: 1e20, suffix: "Sx" }, // Sextillions
		{ threshold: 1e18, divisor: 1e17, suffix: "Qi" }, // Quintillions
		{ threshold: 1e15, divisor: 1e14, suffix: "Qa" }, // Quadrillions
		{ threshold: 1e12, divisor: 1e11, suffix: "T" },  // Trillions
		{ threshold: 1e9, divisor: 1e8, suffix: "B" },    // Billions
		{ threshold: 1e6, divisor: 1e5, suffix: "M" },    // Millions
		{ threshold: 1e3, divisor: 1e2, suffix: "K" },    // Thousands
	];
	
	for (const { threshold, divisor, suffix } of suffixes) {
		if (cash >= threshold) {
			const value = math.floor(cash / divisor) / 10;
			return `$ ${value}${suffix}`;
		}
	}
	
	return `$ ${cash}`;
}