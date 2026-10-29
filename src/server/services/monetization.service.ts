import { AnalyticsService, MarketplaceService, Players } from "@rbxts/services"
import { Dependency, Module, Service, type OnInit, type OnStart } from "@typetorch/framework"
import { t } from "@rbxts/t"
import { getConfig } from "shared/config.helper"
import { Logger } from "shared/common/logger"
import { PRODUCTS, ISLAND_SKIP_PRODUCTS, getAllBigCheckpoints } from "shared/purchasables"
import { IPurchasableConfig, IReward, IRewardType } from "shared/type.helper"
import type { CartService } from "./cart.service"
import { DataService } from "./data.service"
import type { CheckpointService } from "./checkpoint.service"
import type { CustomizationService } from "./customization.service"
import type { ShopService } from "./shop.service"
import {
	getCheckpointDataFromIndex,
	getNextBigCheckpoint
} from "shared/cart.helper"
import { network } from "shared/net"
import { A } from "shared/common/assets"
import { Tasks } from "shared/tasks"

@Service()
export class MonetizationService extends Module implements OnInit, OnStart {
	private readonly logger = new Logger("monetization.service")
	private tasks!: Tasks
	constructor(private readonly data: DataService) {
		super()
	}
	getPurchasables() {
		return getConfig().PurchasableConfig as IPurchasableConfig
	}
	onInit(): void {
		this.tasks = new Tasks(this.trove)
		MarketplaceService.ProcessReceipt = (receipt) => this.processReceipt(receipt)
		// The callback belongs to this generation. A receipt that arrives between two generations is sent again.
		this.trove.add(() => {
			(MarketplaceService as unknown as { ProcessReceipt?: unknown }).ProcessReceipt = undefined
		})
	}
	onStart(): void {
		this.validateConfigs()
	}
	validateConfigs(): void {
		const config = getConfig()
		const VALID_REWARD_TYPES = ["honk","cash", "revives", "flips", "skip_island", "unlock_island", "cart", "lucky_block", "custom"]
		let errors = 0

		// --- PurchasableConfig ---
		const purchasables = config.PurchasableConfig as defined[]
		if (!typeIs(purchasables, "table")) {
			this.logger.warn("PurchasableConfig: expected an array, got something else entirely")
			return
		}
		purchasables.forEach((entry: defined, i) => {
			const e = entry as { product_id?: unknown; rewards?: unknown }
			const problems: string[] = []

			if (!t.number(e.product_id)) {
				problems.push(`product_id is ${typeOf(e.product_id)} (expected number)`)
			}
			if (!typeIs(e.rewards, "table")) {
				problems.push(`rewards is ${typeOf(e.rewards)} (expected array)`)
			} else {
				(e.rewards as defined[]).forEach((reward: defined, j) => {
					const r = reward as { type?: unknown; value?: unknown }
					const rProblems: string[] = []
					if (!t.string(r.type) || !VALID_REWARD_TYPES.includes(r.type)) {
						rProblems.push(`type=${tostring(r.type)} is not a valid reward type (got ${typeOf(r.type)}, expected one of: ${VALID_REWARD_TYPES.join(", ")})`)
					}
					if (!t.number(r.value) && !t.string(r.value)) {
						rProblems.push(`value=${tostring(r.value)} is ${typeOf(r.value)} (expected number or string)`)
					}
					if (rProblems.size() > 0) {
						this.logger.warn(`PurchasableConfig[${i}].rewards[${j}]: ${rProblems.join("; ")}`)
						errors++
					}
				})
			}

			if (problems.size() > 0) {
				this.logger.warn(`PurchasableConfig[${i}] (product_id=${tostring(e.product_id)}): ${problems.join("; ")}`)
				errors++
			}
		})

		// --- CartConfig ---
		const cartConfig = config.CartConfig as defined[]
		if (!typeIs(cartConfig, "table")) {
			this.logger.warn("CartConfig: expected an array, got something else entirely")
			return
		}
		cartConfig.forEach((entry: defined, i) => {
			const c = entry as { name?: unknown; friction?: unknown; power?: unknown }
			const problems: string[] = []

			if (!t.string(c.name)) problems.push(`name is ${typeOf(c.name)} (expected string)`)
			if (!t.number(c.friction)) problems.push(`friction is ${typeOf(c.friction)} (expected number)`)
			if (!t.number(c.power)) problems.push(`power is ${typeOf(c.power)} (expected number)`)

			if (problems.size() > 0) {
				this.logger.warn(`CartConfig[${i}] (name=${tostring(c.name)}): ${problems.join("; ")}`)
				errors++
			}
		})

		if (errors === 0) {
			this.logger.log(`Config validation passed — ${purchasables.size()} purchasables, ${cartConfig.size()} cart entries all OK`)
		}
	}
	/**
	 * Developer product receipts, granted once (Player data guide, "Developer products"): the grant and the PurchaseId
	 * go into the buyer's profile together, and PurchaseGranted is answered only once a save holds the id. A receipt
	 * Roblox sends again (a retry, another server, after a swap) grants nothing and only waits for that save.
	 */
	processReceipt(reciept: ReceiptInfo): Enum.ProductPurchaseDecision {
		const user_id = reciept.PlayerId
		const player = Players.GetPlayerByUserId(user_id)
		if (!player) {
			return Enum.ProductPurchaseDecision.NotProcessedYet
		}
		this.tasks.spawn(() => {
			const product_data = MarketplaceService.GetProductInfoAsync(
				reciept.ProductId,
				Enum.InfoType.Product
			) as ProductInfo
			if (!product_data) {
				this.logger.warn(
					`No product data found for product id ${reciept.ProductId}`
				)
			}
			this.logger.log(
				`PURCHASE_RECEIPT: player=${player.Name}, product_id=${reciept.ProductId}, product_name=${product_data.Name}`
			)
		})
		if (this.data.wasGranted(reciept)) {
			return this.data.grantOnce(reciept, () => {})
		}
		const grant = this.resolveGrant(player, reciept)
		if (!grant) {
			return Enum.ProductPurchaseDecision.NotProcessedYet
		}
		return this.data.grantOnce(reciept, () => {
			this.data.changeOrderedStat(player, "robux_spent", reciept.CurrencySpent)
			grant()
		})
	}
	/** What a receipt grants (run once by grantOnce), or undefined when it can't be granted (NotProcessedYet). */
	private resolveGrant(player: Player, reciept: ReceiptInfo): (() => void) | undefined {
		const purchasables = this.getPurchasables()
		const product_id = reciept.ProductId
		const purchasable = purchasables.find((p) => p.product_id === product_id)
		
		// Check if it's an island skip product
		let skip_count: number | undefined
		ISLAND_SKIP_PRODUCTS.forEach((prod_id, skip_amount) => {
			if (prod_id === product_id) {
				skip_count = skip_amount
			}
		})
		
		if (skip_count !== undefined) {
			const skip = skip_count
			// Get player's highest unlocked checkpoint
			const checkpoint_service = Dependency<CheckpointService>()
			const collected = checkpoint_service.getPlayerCheckpoints(player)
			const highest_unlocked = collected.sort((a, b) => a > b)[0] || 0

			// Calculate target checkpoint based on skip count
			const big_checkpoints = getAllBigCheckpoints()
			const current_index = big_checkpoints.indexOf(highest_unlocked)

			if (current_index !== -1 && current_index + skip < big_checkpoints.size()) {
				return () => {
					// Unlock all checkpoints up to and including target
					for (let i = current_index + 1; i <= current_index + skip; i++) {
						const checkpoint_to_unlock = big_checkpoints[i]
						const virtual_reward: IReward<"unlock_island"> = {
							type: "unlock_island",
							value: checkpoint_to_unlock,
							handler: undefined
						}
						this.giveRewardToPlayer(player, virtual_reward, `island_skip_${skip}_purchase`)
					}
				}
			}
		}
		
		// Check if it's the single honk purchase product
		if (product_id === PRODUCTS.honk) {
			const shop_service = Dependency<ShopService>()
			const honk_name = shop_service.getPendingHonkPurchase(player)
			if (!honk_name) {
				this.logger.warn(
					`Player ${player.Name} purchased honk product but had no pending honk`
				)
				return undefined
			}
			return () => {
				shop_service.clearPendingHonkPurchase(player)
				const virtual_reward: IReward<"honk"> = {
					type: "honk",
					value: honk_name,
					handler: undefined
				}
				this.logger.log(`Processing honk purchase for player ${player.Name}, granting honk: ${honk_name}`)
				this.giveRewardToPlayer(player, virtual_reward, `honk_purchase_${honk_name}`)
			}
		}

		// If not found in PurchasableConfig, check CartConfig
		if (!purchasable) {
			const cart_config = getConfig().CartConfig
			const cart_entry = cart_config.find((cart) => 
				"product_id" in cart && cart.product_id === product_id
			)
			
			if (cart_entry) {
				return () => {
					// Create virtual reward for cart purchase
					const virtual_reward: IReward<"cart"> = {
						type: "cart",
						value: cart_entry.name,
						handler: undefined
					}
					this.logger.log(`Processing cart purchase for product id ${product_id}, granting cart: ${cart_entry.name}`)
					this.giveRewardToPlayer(player, virtual_reward, `cart_purchase_${product_id}`)
				}
			}
			
			this.logger.warn(`No purchasable found for product id ${product_id}`)
			return undefined
		}
		
		return () => {
			const rewards = purchasable.rewards
			for (const reward of rewards) {
				this.giveRewardToPlayer(
					player,
					reward,
					`${purchasable.product_id || "unknown purchasable"}`
				)
			}
		}
	}
	giveRewardToPlayer(
		player: Player,
		reward: IReward<IRewardType>,
		source_descriptor: string
	) {
		switch (reward.type) {
			case "revives":
				const new_revives = Dependency<CartService>().incrementPlayerRevives(
					player,
					reward.value as number
				)
				if (new_revives === undefined) {
					return
				}
				AnalyticsService.LogEconomyEvent(
					player,
					Enum.AnalyticsEconomyFlowType.Source,
					"revives",
					reward.value as number,
					new_revives,
					Enum.AnalyticsEconomyTransactionType.IAP.Name,
					source_descriptor
				)
				return
			case "flips":
				const new_flips = Dependency<CartService>().incrementPlayerFlips(
					player,
					reward.value as number
				)
				if (new_flips === undefined) {
					return
				}
				AnalyticsService.LogEconomyEvent(
					player,
					Enum.AnalyticsEconomyFlowType.Source,
					"flips",
					reward.value as number,
					new_flips,
					Enum.AnalyticsEconomyTransactionType.IAP.Name,
					source_descriptor
				)
				return
			case "cash":
				const new_cash = Dependency<DataService>().grantPlayerCash(
					player,
					reward.value as number,
					`Purchase of ${reward.value} cash`
				)
				if (new_cash === undefined) {
					return
				}
				AnalyticsService.LogEconomyEvent(
					player,
					Enum.AnalyticsEconomyFlowType.Source,
					"cash",
					reward.value as number,
					new_cash,
					Enum.AnalyticsEconomyTransactionType.IAP.Name,
					source_descriptor
				)
				return
			case "custom":
				if (reward.handler) {
					reward.handler(player)
				}
				return
			case "skip_island": {
				const checkpoint_service = Dependency<CheckpointService>()
				const player_checkpoint = checkpoint_service.getCheckpointIndex(player)
				const target_checkpoint = getNextBigCheckpoint(player_checkpoint)
				const data = getCheckpointDataFromIndex(target_checkpoint)
				checkpoint_service.setCheckpointIndex(player, target_checkpoint)
				checkpoint_service.spawnPlayerAtTheirBigCheckpoint(player)
				this.tasks.delay(0.1, () => {
					network.server.CartService.forceCloseDeathScreen.fire(player)
					player.LoadCharacterAsync()
				})
				network.server.NotificationService.sendNotification.fire(player, {
					description: `<font color="rgb(0, 255, 0)">${data?.name || "Unknown Island"}</font>`,
					title: "Island Skipped",
					duration: 10,
					soundId: A.sounds.reward_earned
				})
				return
			}
			case "honk": {
				const data_svc = Dependency<DataService>()
				const profile = data_svc.getProfile(player)
				if (!profile) return
				if (!profile.Data.inventory["honk"]) {
					profile.Data.inventory["honk"] = []
				}
				if (!profile.Data.inventory["honk"].includes(reward.value as string)) {
					profile.Data.inventory["honk"].push(reward.value as string)
				}
				const customization_svc = Dependency<CustomizationService>()
				customization_svc.setPreferenceUnchecked(player, "honk", reward.value as string)
				network.server.NotificationService.sendNotification.fire(player, {
					title: "<b>Honk Unlocked!</b>",
					description: `<font color='#00D4FF'>${reward.value}</font>`,
					duration: 4,
					soundId: A.sounds.reward_earned
				})
				break
			}
			case "cart":
				Dependency<CartService>().grantPlayerPermaCart(
					player,
					reward.value as string
				)
				break
			case "unlock_island": {
				const checkpoint_service = Dependency<CheckpointService>()
				const checkpoint_index = reward.value as number
				checkpoint_service.unlockCheckpointForPlayer(player, checkpoint_index)
				const data = getCheckpointDataFromIndex(checkpoint_index)
				network.server.NotificationService.sendNotification.fire(player, {
					description: `<font color="rgb(255, 215, 0)">${data?.name || "Unknown Island"}</font> is now unlocked!`,
					title: "Island Unlocked",
					duration: 10,
					soundId: A.sounds.reward_earned
				})
				break
			}
			default:
				this.logger.warn(`Unknown reward type ${reward.type}`)
		}
	}
}
