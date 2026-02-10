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