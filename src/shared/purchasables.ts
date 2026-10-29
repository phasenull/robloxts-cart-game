import { ISLAND_CONFIG } from "./cart.helper"

export const purchasables = {
	gamepasses: [
		// 1694311829,1691413212
		2296901, 2218187, 2070427, 56149618, 2219040, 4974038, 2725211
	],
	products: [3534293774, 3532858318, 3534758322,3535523608,3535705767,3535708292]
}
export const PRODUCTS = {
	flips: 3534293774,
	revives: 3532858318,

	revives_10:3534758322,
	skip_island:3535471413,

	// Island unlock products (skip-based)
	unlock_island_skip_1: 3535471413, // Skip 1 island

	// Single product used for all honk purchases
	// The specific honk name is tracked server-side per player
	honk: 3542257811, // TODO: replace with real product ID
}

// Map of number of islands to skip to product ID
// Key: number of big checkpoints to skip
// Value: product ID for that skip amount
export const ISLAND_SKIP_PRODUCTS: Map<number, number> = new Map([
	[1, PRODUCTS.unlock_island_skip_1],
	[2, 3539903167],
	[3, 3539903264],
	[4, 3539906057],
	[5, 3539906238],
	[6, 3539906322],
	[7, 3539906434],
])

// Helper function to get product ID based on skip count
export function getIslandSkipProduct(skipCount: number): number | undefined {
	return ISLAND_SKIP_PRODUCTS.get(skipCount)
}

// Helper function to get all big checkpoint indices dynamically (from the static ISLAND_CONFIG)
export function getAllBigCheckpoints(): number[] {
	const checkpoints: number[] = []
	
	for (const [key] of pairs(ISLAND_CONFIG)) {
		const num = tonumber(key)
		if (num !== undefined) {
			checkpoints.push(num)
		}
	}
	checkpoints.sort((a: number, b: number) => a < b)
	return checkpoints
}

// Helper function to calculate how many big checkpoints between two indices
export function calculateBigCheckpointSkips(from: number, to: number): number {
	const checkpoints = getAllBigCheckpoints()
	const fromIndex = checkpoints.indexOf(from)
	const toIndex = checkpoints.indexOf(to)
	
	if (fromIndex === -1 || toIndex === -1 || toIndex <= fromIndex) {
		return 0
	}
	
	return toIndex - fromIndex
}
