import { Dependency, OnStart, Service } from "@flamework/core"
import { Players } from "@rbxts/services"
import { Logger } from "shared/logger"
import { ProperReturns } from "shared/type.helper"
import { DataService } from "./data.service"
import { ServerFunctions } from "shared/network.helper"

export type ICustomizable = "cart" | "honk" | (string & {})

@Service()
export class CustomizationService implements OnStart {
	constructor(
		private logger: Logger,
		private dataService: DataService
	) {}

	public onStart(): void {
		this.logger.log("CustomizationService started")

		// Register network functions
		ServerFunctions.CustomizationService.getPlayerPreference.setCallback((player, item_type) => {
			return this.getPlayerPreference(player, item_type)
		})

		ServerFunctions.CustomizationService.setPreference.setCallback((player, key, value) => {
			return this.setPreference(player, key, value)
		})
	}

	/**
	 * Get player preferences for a specific customization type
	 * @param player The player to get preferences for
	 * @param item_type The type of customization (e.g., "cart", "honk")
	 * @returns Array of preference strings, or error message
	 */
	public getPlayerPreference(
		player: Player,
		item_type: ICustomizable
	): ProperReturns<string[]> {
		const profile = this.dataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to get preferences for player ${player.Name} but their profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		const customization = profile.Data.customization
		if (!customization) {
			return [[]]
		}

		return [customization[item_type] || []]
	}

	/**
	 * Set a player's preference for a specific customization type
	 * @param player The player to set preferences for
	 * @param key The customization type key
	 * @param value The value to add to the preferences list
	 * @returns True if successful, or error message
	 */
	public setPreference(
		player: Player,
		key: ICustomizable,
		value: string
	): ProperReturns<true> {
		const profile = this.dataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to set preferences for player ${player.Name} but their profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		// Initialize customization if it doesn't exist
		if (!profile.Data.customization) {
			profile.Data.customization = {}
		}

		// Initialize the key array if it doesn't exist
		if (!profile.Data.customization[key]) {
			profile.Data.customization[key] = []
		}

		// Check if value already exists
		const preferences = profile.Data.customization[key]
		if (preferences.includes(value)) {
			this.logger.log(
				`Player ${player.Name} already has preference "${value}" for "${key}"`
			)
			return [true]
		}

		// Add the value to the preferences list
		profile.Data.customization[key].push(value)
		this.logger.log(
			`Added preference "${value}" for player ${player.Name} in category "${key}"`
		)
		return [true]
	}

	/**
	 * Remove a player's preference for a specific customization type
	 * @param player The player to remove preferences from
	 * @param key The customization type key
	 * @param value The value to remove from the preferences list
	 * @returns True if successful, or error message
	 */
	public removePreference(
		player: Player,
		key: ICustomizable,
		value: string
	): ProperReturns<true> {
		const profile = this.dataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to remove preferences for player ${player.Name} but their profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		if (!profile.Data.customization || !profile.Data.customization[key]) {
			return [false, "Customization key not found"]
		}

		const preferences = profile.Data.customization[key]
		const index = preferences.indexOf(value)
		if (index === -1) {
			return [false, "Value not found in preferences"]
		}

		// Remove the value from the array
		preferences.remove(index)
		this.logger.log(
			`Removed preference "${value}" for player ${player.Name} in category "${key}"`
		)
		return [true]
	}

	/**
	 * Clear all preferences for a specific customization type
	 * @param player The player to clear preferences for
	 * @param key The customization type key
	 * @returns True if successful, or error message
	 */
	public clearPreferences(
		player: Player,
		key: ICustomizable
	): ProperReturns<true> {
		const profile = this.dataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to clear preferences for player ${player.Name} but their profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		if (!profile.Data.customization) {
			return [false, "No customization data found"]
		}

		profile.Data.customization[key] = []
		this.logger.log(
			`Cleared all preferences for player ${player.Name} in category "${key}"`
		)
		return [true]
	}

	/**
	 * Get all customization categories for a player
	 * @param player The player to get categories for
	 * @returns Record of all customization categories and their values, or error message
	 */
	public getAllPreferences(player: Player): ProperReturns<Record<string, string[]>> {
		const profile = this.dataService.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Tried to get all preferences for player ${player.Name} but their profile was not loaded`
			)
			return [false, "Profile not loaded"]
		}

		return [profile.Data.customization || {}]
	}
}
