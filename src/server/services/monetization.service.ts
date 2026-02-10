import { Dependency, OnStart, Service } from "@flamework/core";
import { MarketplaceService, Players } from "@rbxts/services";
import { getConfig } from "shared/config.helper";
import { Logger } from "shared/logger";
import { PRODUCTS } from "shared/purchasables";
import { IPurchasableConfig, IReward, IRewardType } from "shared/type.helper";
import { CartService } from "./cart.service";
import { DataService } from "./data.service";

@Service()
export class MonetizationService implements OnStart {
	constructor(private logger: Logger) {}
	getPurchasables() {
		return getConfig().PurchasableConfig as IPurchasableConfig;
	}
	onStart(): void {
		Players.PlayerAdded.Connect((p) => this.playerAdded(p));
		const CartService = Dependency<CartService>();
		MarketplaceService.ProcessReceipt = this.processReceipt;
	}
	processReceipt(reciept: ReceiptInfo): Enum.ProductPurchaseDecision {
		const user_id = reciept.PlayerId;
		const player = Players.GetPlayerByUserId(user_id);
		if (!player) {
			return Enum.ProductPurchaseDecision.NotProcessedYet;
		}
		const purchasables = this.getPurchasables();
		const product_id = reciept.ProductId;
		const purchasable = purchasables.find((p) => p.product_id === product_id);
		if (!purchasable) {
			this.logger.warn(`No purchasable found for product id ${product_id}`);
			return Enum.ProductPurchaseDecision.NotProcessedYet;
		}
		const rewards = purchasable.rewards;
		for (const reward of rewards) {
			this.giveRewardToPlayer(player, reward);
		}
		return Enum.ProductPurchaseDecision.PurchaseGranted;
	}
	giveRewardToPlayer(player: Player, reward: IReward<IRewardType>) {
		switch (reward.type) {
			case "revives":
				Dependency<CartService>().incrementPlayerRevives(player, reward.value);
				break;
			case "flips":
				Dependency<CartService>().incrementPlayerFlips(
					player,
					reward.value,
				);
				break;
			case "cash":
				Dependency<DataService>().grantPlayerCash(
					player,
					reward.value,
					`Purchase of ${reward.value} cash`,
				);
				break;
			case "custom":
				if (reward.handler) {
					reward.handler(player);
				}
				break;
			case "cart":
				Dependency<CartService>().grantPlayerPermaCart(player, reward.descriptor);
			default:
				this.logger.warn(`Unknown reward type ${reward.type}`);
		}
	}
	playerAdded(player: Player) {}
}
