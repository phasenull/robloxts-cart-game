import { ICartEntry } from "./type.helper"

export const MOCK_CART_SHOP = [
	{ name: "Cart", price: 0 },
	{ name: "Fast Cart", price: 100 },
	{ name: "Spiky Cart", price: 250 },
	{ name: "V8 Cart", price: 500 },
	{ name: "Rainbow Cart", product_id: 123456789 }, // Mock Robux item
]

// Mock inventory with full ICartEntry objects
export const MOCK_INVENTORY: ICartEntry[] = [
	{ name: "Cart", price: 0, friction: 1.0, power: 100, max_velocity: 16 },
	{ name: "Fast Cart", price: 100, friction: 0.35, power: 240, max_velocity: 40 }
].filter(() => math.random() > 0.3)

export const MOCK_CASH = 67676767
