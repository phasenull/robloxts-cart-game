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
	unlock_island_skip_2: 3539903167, // Skip 2 islands
	unlock_island_skip_3: 3539903264, // Skip 3 islands
}

// Map of number of islands to skip to product ID
// Key: number of big checkpoints to skip
// Value: product ID for that skip amount
export const ISLAND_SKIP_PRODUCTS: Map<number, number> = new Map([
	[1, PRODUCTS.unlock_island_skip_1],
	[2, PRODUCTS.unlock_island_skip_2],
	[3, PRODUCTS.unlock_island_skip_3],
])

// Helper function to get product ID based on skip count
export function getIslandSkipProduct(skipCount: number): number | undefined {
	return ISLAND_SKIP_PRODUCTS.get(skipCount)
}

// Helper function to calculate how many big checkpoints between two indices
export function calculateBigCheckpointSkips(from: number, to: number): number {
	const checkpoints = [0, 2, 4, 6] // Big checkpoint indices
	const fromIndex = checkpoints.indexOf(from)
	const toIndex = checkpoints.indexOf(to)
	
	if (fromIndex === -1 || toIndex === -1 || toIndex <= fromIndex) {
		return 0
	}
	
	return toIndex - fromIndex
}
