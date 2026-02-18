import { Dependency, OnStart, Service } from "@flamework/core"
import { AnalyticsService, MarketplaceService, Players } from "@rbxts/services"
import { getConfig } from "shared/config.helper"
import { Logger } from "shared/logger"
import { PRODUCTS, ISLAND_SKIP_PRODUCTS } from "shared/purchasables"
import { IPurchasableConfig, IReward, IRewardType } from "shared/type.helper"
import { CartService } from "./cart.service"
import { DataService } from "./data.service"
import { CheckpointService } from "./checkpoint.service"
import {
	getCheckpointDataFromIndex,
	getNextBigCheckpoint
} from "shared/cart.helper"
import { ServerEvents } from "shared/network.helper"
import { A } from "shared/assets"

@Service()
export class MonetizationService implements OnStart {
	constructor(private logger: Logger) {}
	getPurchasables() {
		return getConfig().PurchasableConfig as IPurchasableConfig
	}
	onStart(): void {
		Players.PlayerAdded.Connect((p) => this.playerAdded(p))
		const CartService = Dependency<CartService>()
		MarketplaceService.ProcessReceipt = (receipt) =>
			this.processReceipt(receipt)
	}
	processReceipt(reciept: ReceiptInfo): Enum.ProductPurchaseDecision {
		const user_id = reciept.PlayerId
		const player = Players.GetPlayerByUserId(user_id)
		if (!player) {
			return Enum.ProductPurchaseDecision.NotProcessedYet
		}
		task.spawn(() => {
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
				`PURCHASE_RECEIPT_PROCESSED: player=${player.Name}, product_id=${reciept.ProductId}, product_name=${product_data.Name}`
			)
		})
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
			// Get player's highest unlocked checkpoint
			const checkpoint_service = Dependency<CheckpointService>()
			const collected = checkpoint_service.getPlayerCheckpoints(player)
			const highest_unlocked = collected.sort((a, b) => a > b)[0] || 0
			
			// Calculate target checkpoint based on skip count
			const big_checkpoints = [0, 2, 4, 6]
			const current_index = big_checkpoints.indexOf(highest_unlocked)
			
			if (current_index !== -1 && current_index + skip_count < big_checkpoints.size()) {
				const target_checkpoint = big_checkpoints[current_index + skip_count]
				
				// Unlock all checkpoints up to and including target
				for (let i = current_index + 1; i <= current_index + skip_count; i++) {
					const checkpoint_to_unlock = big_checkpoints[i]
					const virtual_reward: IReward<"unlock_island"> = {
						type: "unlock_island",
						descriptor: undefined as never,
						value: checkpoint_to_unlock,
						handler: undefined
					}
					this.giveRewardToPlayer(player, virtual_reward, `island_skip_${skip_count}_purchase`)
				}
				
				return Enum.ProductPurchaseDecision.PurchaseGranted
			}
		}
		
		// If not found in PurchasableConfig, check CartConfig
		if (!purchasable) {
			const cart_config = getConfig().CartConfig
			const cart_entry = cart_config.find((cart) => 
				"product_id" in cart && cart.product_id === product_id
			)
			
			if (cart_entry) {
				// Create virtual reward for cart purchase
				const virtual_reward: IReward<"cart"> = {
					type: "cart",
					descriptor: cart_entry.name,
					value: undefined as never,
					handler: undefined
				}
				this.giveRewardToPlayer(player, virtual_reward, `cart_purchase_${product_id}`)
				return Enum.ProductPurchaseDecision.PurchaseGranted
			}
			
			this.logger.warn(`No purchasable found for product id ${product_id}`)
			return Enum.ProductPurchaseDecision.NotProcessedYet
		}
		
		const rewards = purchasable.rewards
		for (const reward of rewards) {
			this.giveRewardToPlayer(
				player,
				reward,
				`${purchasable.product_id || "unknown purchasable"}`
			)
		}
		return Enum.ProductPurchaseDecision.PurchaseGranted
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
					reward.value
				)
				if (new_revives === undefined) {
					return
				}
				AnalyticsService.LogEconomyEvent(
					player,
					Enum.AnalyticsEconomyFlowType.Source,
					"revives",
					reward.value,
					new_revives,
					Enum.AnalyticsEconomyTransactionType.IAP.Name,
					source_descriptor
				)
				return
			case "flips":
				const new_flips = Dependency<CartService>().incrementPlayerFlips(
					player,
					reward.value
				)
				if (new_flips === undefined) {
					return
				}
				AnalyticsService.LogEconomyEvent(
					player,
					Enum.AnalyticsEconomyFlowType.Source,
					"flips",
					reward.value,
					new_flips,
					Enum.AnalyticsEconomyTransactionType.IAP.Name,
					source_descriptor
				)
				return
			case "cash":
				const new_cash = Dependency<DataService>().grantPlayerCash(
					player,
					reward.value,
					`Purchase of ${reward.value} cash`
				)
				if (new_cash === undefined) {
					return
				}
				AnalyticsService.LogEconomyEvent(
					player,
					Enum.AnalyticsEconomyFlowType.Source,
					"cash",
					reward.value,
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
				task.delay(0.1, () => {
					ServerEvents.CartService.forceCloseDeathScreen.fire(player)
					player.LoadCharacterAsync()
				})
				ServerEvents.NotificationService.sendNotification.fire(player, {
					description: `<font color="rgb(0, 255, 0)">${data?.name || "Unknown Island"}</font>`,
					title: "Island Skipped",
					duration: 5,
					soundId: A.sounds.reward_earned
				})
				return
			}
			case "cart":
				Dependency<CartService>().grantPlayerPermaCart(
					player,
					reward.descriptor
				)
				break
			case "unlock_island": {
				const checkpoint_service = Dependency<CheckpointService>()
				const checkpoint_index = reward.value
				checkpoint_service.unlockCheckpointForPlayer(player, checkpoint_index)
				const data = getCheckpointDataFromIndex(checkpoint_index)
				ServerEvents.NotificationService.sendNotification.fire(player, {
					description: `<font color="rgb(255, 215, 0)">${data?.name || "Unknown Island"}</font> is now unlocked!`,
					title: "Island Unlocked",
					duration: 5,
					soundId: A.sounds.reward_earned
				})
				break
			}
			default:
				this.logger.warn(`Unknown reward type ${reward.type}`)
		}
	}
	playerAdded(player: Player) {}
}
