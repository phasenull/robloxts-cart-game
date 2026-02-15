export const MOCK_CART_SHOP = [
	{ name: "Cart", price: 0 },
	{ name: "Fast Cart", price: 100 },
	{ name: "Spiky Cart", price: 250 },
	{ name: "V8 Cart", price: 500 },
	{ name: "Rainbow Cart", price: 1000 }
]
export const MOCK_INVENTORY = MOCK_CART_SHOP.map((item) =>
	math.random() > 0.6 ? item.name : undefined
).filterUndefined()
