import { createNetwork, type ProperReturns } from "@typetorch/framework"
import { ButtonModel, IInventoryData, INotification, IShopItem, IShopItemTypes } from "./type.helper"

export interface IFeedbackItem {
	id: number
	user_id: number
	description: string
	status: "pending" | "rejected" | "approved"
	response: string | undefined
	responded_at: number | undefined
	deleted_at: number | undefined
	created_at: number
}

/** Client -> server. Every leaf gets a generated guard; the handlers keep the game's own checks. */
interface ClientToServer {
	CartService: {
		spawnCart(button: ButtonModel): void
		honk(): void
		reset(): ProperReturns<true>
		useProduct(product_key: string): ProperReturns<true>
		revive(target: CFrame, stage: number): ProperReturns<true>
	}
	FeedbackService: {
		submitFeedback(description: string): ProperReturns<IFeedbackItem>
		getMyFeedbacks(): ProperReturns<IFeedbackItem[]>
	}
	CheckpointService: {
		setCheckpoint(index: number): void
		processPlayerDeath(): void
		tpMeToBigCheckpoint(): ProperReturns<true>
		tpMeToCheckpoint(checkpoint_index: number): ProperReturns<true>
		getCheckpointState(): ProperReturns<{
			current_checkpoint: number
			collected_checkpoints: number[]
		}>
	}
	ShopService: {
		getShopConfig(): ProperReturns<Record<string, IShopItem[]>>
		getShopItems(item_type: IShopItemTypes): ProperReturns<IShopItem[]>
		canPlayerAffordItem(item_type: IShopItemTypes, item_name: string): ProperReturns<boolean>
		makePlayerPurchaseItem(item_type: IShopItemTypes, item_name: string): ProperReturns<true>
		getPlayerInventory(item_type: IShopItemTypes): ProperReturns<IInventoryData>
		doesPlayerOwnItem(item_type: IShopItemTypes, item_name: string): ProperReturns<boolean>
		promptHonkPurchase(honk_name: string): ProperReturns<true>
	}
	CustomizationService: {
		getPlayerPreference(item_type: string): ProperReturns<string[]>
		setPreference(key: string, value: string): ProperReturns<true>
	}
	DataService: {
		getCash(): ProperReturns<number>
	}
	PlatformService: {
		onEnter(platform: BasePart): void
		onLeave(platform: BasePart): void
	}
	/** Centurion's transport (it would otherwise create its own RemoteEvents and RemoteFunction). */
	centurion: {
		syncStart(): void
		execute(path: string, args: string[]): ProperReturns<unknown>
	}
}

/** Server -> client. */
interface ServerToClient {
	CheckpointService: {
		updateCheckpointState(new_checkpoint: number, collected_checkpoints: number[]): void
	}
	CartService: {
		playerProductsUpdated(data: Map<string, number>): void
		clearDeathPreview(): void
		forceCloseDeathScreen(): void
		boxingGlovePunch(touch_position: Vector3): void
		honkVfx(cartModel: Model, soundDuration: number): void
	}
	NotificationService: {
		sendNotification(notification: INotification): void
	}
	DataService: {
		updatePlayerCash(cash: number): void
	}
	CashService: {
		cashCollected(position: Vector3): void
	}
	centurion: {
		/** Centurion's SyncData (command and group options): plain data built by the server. */
		syncDispatch(data: unknown): void
	}
}

export const network = createNetwork<ClientToServer, ServerToClient>()
