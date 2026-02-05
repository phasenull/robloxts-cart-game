
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
