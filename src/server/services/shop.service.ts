import { Dependency, OnStart, Service } from "@flamework/core";
import { Logger } from "shared/logger";
import { IShopItemTypes, IShopItem, ProperReturns } from "shared/type.helper";
import { DataService } from "./data.service";
import { CartService } from "./cart.service";
import { getConfig } from "shared/config.helper";
import { ServerEvents } from "shared/network.helper";
import { A } from "shared/assets";

@Service()
export class ShopService implements OnStart {
	constructor(
		private logger: Logger,
		private DataService: DataService
	) {}

	onStart(): void {
		this.logger.log("ShopService started")
	}
	makePlayerPurchaseItem(player: Player, item_type: IShopItemTypes, item_name: string): ProperReturns<true> {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			this.logger.warn(`Tried to purchase item for player ${player.Name} but profile was not loaded`)
			return [false, "Profile not loaded"]
		}

		// Check if player can afford the item
		const [canAfford, affordError] = this.canPlayerAffordItem(player, item_type, item_name)
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
		profile.Data.cash = (currentCash - price) as any

		// Handle different item types
		switch (item_type) {
			case "cart": {
				const cartService = Dependency<CartService>()
				cartService.grantPlayerPermaCart(player, item_name)
				this.logger.log(`Player ${player.Name} purchased cart: ${item_name} for ${price} cash`)
				break
			}
			case "revives": {
				const cartService = Dependency<CartService>()
				const amount = tonumber(item_name) || 1
				cartService.incrementPlayerRevives(player, amount)
				this.logger.log(`Player ${player.Name} purchased ${amount} revives for ${price} cash`)
				break
			}
			case "flips": {
				const cartService = Dependency<CartService>()
				const amount = tonumber(item_name) || 1
				cartService.incrementPlayerFlips(player, amount)
				this.logger.log(`Player ${player.Name} purchased ${amount} flips for ${price} cash`)
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
					title: "<b>Item Purchased!</b>",
					description: `<font color='#00D4FF'>${item_name}</font>`,
					duration: 4,
					soundId: A.sounds.reward_earned
				})
				this.logger.log(`Player ${player.Name} purchased ${item_type}: ${item_name} for ${price} cash`)
				break
			}
		}

		return [true]
	}
	canPlayerAffordItem(player: Player, item_type: IShopItemTypes, item_name: string): ProperReturns<boolean> {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			this.logger.warn(`Tried to check affordability for player ${player.Name} but profile was not loaded`)
			return [false, "Profile not loaded"]
		}

		// Check if player already owns the item (for non-consumables)
		if (item_type !== "revives" && item_type !== "flips") {
			const [owns, ownsError] = this.doesPlayerOwnItem(player, item_type, item_name)
			if (owns) {
				return [false, "Already owned"]
			}
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
	 * @returns Record of inventory items or error message
	 */
	getPlayerInventory(player: Player, item_type: IShopItemTypes): ProperReturns<Record<string, string[]>> {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			this.logger.warn(`Tried to get inventory for player ${player.Name} but profile was not loaded`)
			return [false, "Profile not loaded"]
		}

		// Special handling for carts/vehicles
		if (item_type === "cart") {
			const vehicles = profile.Data.vehicles || []
			return [{ cart: vehicles }]
		}

		// Return specific item type from inventory
		if (!profile.Data.inventory) {
			return [{}]
		}

		const items = profile.Data.inventory[item_type] || []
		return [{ [item_type]: items }]
	}


	doesPlayerOwnItem(player: Player, item_type: IShopItemTypes, item_name: string): ProperReturns<boolean> {
		const profile = this.DataService.getProfile(player)
		if (!profile) {
			this.logger.warn(`Tried to check ownership for player ${player.Name} but profile was not loaded`)
			return [false, "Profile not loaded"]
		}

		// Special handling for carts/vehicles
		if (item_type === "cart") {
			const cartService = Dependency<CartService>()
			return [cartService.doesPlayerOwnCart(player, item_name)]
		}

		// Consumables (revives, flips) are never "owned" in the traditional sense
		if (item_type === "revives" || item_type === "flips") {
			return [false]
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
	private getItemPrice(item_type: IShopItemTypes, item_name: string): number | undefined {
		const config = getConfig()
		
		// Check if the item type exists in ShopConfig
		if (!config.ShopConfig || !config.ShopConfig[item_type]) {
			this.logger.warn(`ShopConfig missing for item type: ${item_type}`)
			return undefined
		}

		// Find the item in the shop config
		const shopItems = config.ShopConfig[item_type]
		const shopItem = shopItems.find((item) => item.name === item_name)
		
		if (shopItem) {
			return shopItem.price
		}

		this.logger.warn(`Item ${item_name} not found in ShopConfig for type ${item_type}`)
		return undefined
	}

	/**
	 * Get all available shop items for a specific type
	 * @param item_type The type of items to retrieve
	 * @returns Array of shop items or empty array
	 */
	getShopItems(item_type: IShopItemTypes): ProperReturns<IShopItem[]> {
		const config = getConfig()
		
		if (!config.ShopConfig || !config.ShopConfig[item_type]) {
			return [[]]
		}

		return [config.ShopConfig[item_type]]
	}

	/**
	 * Get the entire shop configuration
	 * @returns The full shop config
	 */
	getShopConfig(): ProperReturns<Record<string, IShopItem[]>> {
		const config = getConfig()
		
		if (!config.ShopConfig) {
			this.logger.warn("ShopConfig is missing from game config")
			return [false, "Shop config not found"]
		}

		return [config.ShopConfig]
	}

}