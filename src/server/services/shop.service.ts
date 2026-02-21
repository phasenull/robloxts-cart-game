import { Dependency, OnStart, Service } from "@flamework/core"
import { Logger } from "shared/logger"
import {
	IShopItemTypes,
	IShopItem,
	ProperReturns,
	ICartEntry,
	IInventoryData,
	IReward,
	IRewardType
} from "shared/type.helper"
import { DataService } from "./data.service"
import { CartService } from "./cart.service"
import { getConfig } from "shared/config.helper"
import { ServerEvents, ServerFunctions } from "shared/network.helper"
import { A } from "shared/assets"

@Service()
export class ShopService implements OnStart {
	constructor(
		private logger: Logger,
		private DataService: DataService
	) {}

	onStart(): void {
		this.logger.log("ShopService started")

		// Register network functions
		ServerFunctions.ShopService.getShopConfig.setCallback(() => {
			return this.getShopConfig()
		})

		ServerFunctions.ShopService.getShopItems.setCallback(
			(player, item_type) => {
				return this.getShopItems(item_type)
			}
		)

		ServerFunctions.ShopService.canPlayerAffordItem.setCallback(
			(player, item_type, item_name) => {
				return this.canPlayerAffordItem(player, item_type, item_name)
			}
		)

		ServerFunctions.ShopService.makePlayerPurchaseItem.setCallback(
			(player, item_type, item_name) => {
				return this.makePlayerPurchaseItem(player, item_type, item_name)
			}
		)

		ServerFunctions.ShopService.getPlayerInventory.setCallback(
			(player, item_type) => {
				return this.getPlayerInventory(player, item_type)
			}
		)

		ServerFunctions.ShopService.doesPlayerOwnItem.setCallback(
			(player, item_type, item_name) => {
				return this.doesPlayerOwnItem(player, item_type, item_name)
			}
		)
	}
	makePlayerPurchaseItem(
		player: Player,
		item_type: IShopItemTypes,
		item_name: string
	): ProperReturns<true> {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to purchase item for player ${player.Name} but profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		// Check if player can afford the item
		const [canAfford, affordError] = this.canPlayerAffordItem(
			player,
			item_type,
			item_name
		)
		if (!canAfford) {
			return [false, affordError || "Cannot afford item"]
		}

		// Get price for the item
		const price = this.getItemPrice(item_type, item_name)
		if (price === undefined) {
			return [false, `Item ${item_name} not found in shop`]
		}

		// Deduct currency
		const currentCash = profile.Data.cash || 0

		// Handle different item types
		switch (item_type) {
			case "cart": {
				const cartService = Dependency<CartService>()
				cartService.grantPlayerPermaCart(player, item_name)
				profile.Data.cash = (currentCash - price) as any
				break
			}
			default: {
				// For other item types, add to inventory
				if (!profile.Data.inventory) {
					profile.Data.inventory = {}
				}
				if (!profile.Data.inventory[item_type]) {
					profile.Data.inventory[item_type] = []
				}
				if (!profile.Data.inventory[item_type].includes(item_name)) {
					profile.Data.inventory[item_type].push(item_name)
				}
				ServerEvents.NotificationService.sendNotification(player, {
					title: "<b>Item Purchased</b>",
					description: `<font color='#00D4FF'>${item_name}</font>`,
					duration: 4,
					soundId: A.sounds.reward_earned
				})
				this.logger.log(
					`Player ${player.Name} purchased ${item_type}: ${item_name} for ${price} cash`
				)
				break
			}
		}

		return [true]
	}
	canPlayerAffordItem(
		player: Player,
		item_type: IShopItemTypes,
		item_name: string
	): ProperReturns<boolean> {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to check affordability for player ${player.Name} but profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		// Check if player already owns the item (for non-consumables)
		const [owns, ownsError] = this.doesPlayerOwnItem(
			player,
			item_type,
			item_name
		)
		if (owns) {
			return [false, "Already owned"]
		}

		// Get item price
		const price = this.getItemPrice(item_type, item_name)
		if (price === undefined) {
			return [false, `Item ${item_name} not found`]
		}

		// Check if player has enough cash
		const currentCash = profile.Data.cash || 0
		if (currentCash < price) {
			return [false, `Not enough cash (need ${price}, have ${currentCash})`]
		}

		return [true]
	}

	/**
	 * Get player inventory for a specific item type
	 * @param player The player to get inventory for
	 * @param item_type The type of items to retrieve
	 * @returns Inventory data with ICartEntry[] for carts or error message
	 */
	getPlayerInventory(
		player: Player,
		item_type: IShopItemTypes
	): ProperReturns<IInventoryData> {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to get inventory for player ${player.Name} but profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		// Special handling for carts/vehicles - return full ICartEntry objects
		if (item_type === "cart") {
			const vehicleNames = profile.Data.inventory.vehicles || []
			const config = getConfig()

			if (!config.CartConfig) {
				this.logger.warn("CartConfig is missing")
				return [{ carts: [] }]
			}

			// Enrich vehicle names with full cart config data
			const cartEntries: ICartEntry[] = []
			for (const name of vehicleNames) {
				const cartEntry = config.CartConfig.find((entry) => entry.name === name)
				if (cartEntry) {
					cartEntries.push(cartEntry)
				}
			}

			return [{ carts: cartEntries }]
		}

		// Return specific item type from inventory
		if (!profile.Data.inventory) {
			return [{}]
		}

		const items = profile.Data.inventory[item_type] || []
		return [{ [item_type]: items }]
	}

	doesPlayerOwnItem(
		player: Player,
		item_type: IShopItemTypes,
		item_name: string
	): ProperReturns<boolean> {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to check ownership for player ${player.Name} but profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		// Special handling for carts/vehicles
		if (item_type === "cart") {
			const cartService = Dependency<CartService>()
			return [cartService.doesPlayerOwnCart(player, item_name)]
		}


		// Check in inventory
		if (!profile.Data.inventory || !profile.Data.inventory[item_type]) {
			return [false]
		}

		return [profile.Data.inventory[item_type].includes(item_name)]
	}

	/**
	 * Get the price of an item from the shop configuration
	 * @param item_type The type of item
	 * @param item_name The name of the item
	 * @returns The price in cash, or undefined if not found
	 */
	private getItemPrice(
		item_type: IShopItemTypes,
		item_name: string
	): number | undefined {
		const config = getConfig()

		// Only carts are supported from CartConfig
		if (item_type === "cart") {
			if (!config.CartConfig) {
				this.logger.warn(`CartConfig is missing`)
				return undefined
			}

			const cartEntry = config.CartConfig.find(
				(entry) => entry.name === item_name
			)
			if (cartEntry && "price" in cartEntry) {
				return cartEntry.price
			}

			this.logger.warn(
				`Cart ${item_name} not found or has no price in CartConfig`
			)
			return undefined
		}

		// Other item types are not supported in CartConfig
		this.logger.warn(`Item type ${item_type} is not supported in shop config`)
		return undefined
	}

	/**
	 * Get all available shop items for a specific type
	 * @param item_type The type of items to retrieve
	 * @returns Array of shop items or empty array
	 */
	getShopItems(item_type: IShopItemTypes): ProperReturns<IShopItem[]> {
		const config = getConfig()

		// Only carts are supported from CartConfig
		if (item_type === "cart") {
			if (!config.CartConfig) {
				this.logger.warn("CartConfig is missing")
				return [[]]
			}

			// Convert cart entries to IShopItem (with either price or product_id)
			const cartShopItems: IShopItem[] = []
			for (const entry of config.CartConfig) {
				if ("price" in entry) {
					cartShopItems.push({
						name: entry.name,
						price: entry.price
					})
				} else if ("product_id" in entry) {
					cartShopItems.push({
						name: entry.name,
						product_id: entry.product_id
					})
				}
			}

			return [cartShopItems]
		}

		if (item_type === "honk") {
			const purchasables = config.PurchasableConfig
			const honkItems: IShopItem[] = []
			for (const purchasable of purchasables) {
				for (const reward of purchasable.rewards as IReward<IRewardType>[]) {
					if (reward.type === "honk") {
						honkItems.push({
							name: reward.value as string,
							product_id: purchasable.product_id
						})
					}
				}
			}
			return [honkItems]
		}

		return [[]]
	}

	/**
	 * Get the entire shop configuration
	 * @returns The full shop config
	 */
	getShopConfig(): ProperReturns<Record<string, IShopItem[]>> {
		const config = getConfig()

		const result: Record<string, IShopItem[]> = {}

		// Add carts from CartConfig
		if (config.CartConfig) {
			const cartShopItems: IShopItem[] = []
			for (const entry of config.CartConfig) {
				if ("price" in entry) {
					cartShopItems.push({
						name: entry.name,
						price: entry.price
					})
				} else if ("product_id" in entry) {
					cartShopItems.push({
						name: entry.name,
						product_id: entry.product_id
					})
				}
			}
			result.cart = cartShopItems
		}

		if (!result.cart || result.cart.size() === 0) {
			this.logger.warn(
				"Shop config is empty - no carts with prices found in CartConfig"
			)
			return [false, "Shop config not found"]
		}

		return [result]
	}
}
