import { Networking } from "@flamework/networking"
import {
	ClientHandler,
	ServerHandler
} from "@flamework/networking/out/events/types"
import {
	ClientHandler as ClientHandlerFunction,
	ServerHandler as ServerHandlerFunction
} from "@flamework/networking/out/functions/types"
import { __IS_CLIENT__, __IS_EDIT__, __IS_SERVER__ } from "./config.helper"
import { ButtonModel, ICart, ICartConfig, IInventoryData, INotification, IShopItem, IShopItemTypes, ProperReturns } from "./type.helper"
/*

	SERVER TO CLIENT

*/
interface ServerToClientFunctions {}
interface ServerToClientEvents {
	CheckpointService: {
		updateCheckpointState: (
			new_checkpoint: number,
			collected_checkpoints: number[]
		) => void
	},
	CartService: {
		playerProductsUpdated: (data:Map<string, number>) => void
		clearDeathPreview: () => void
		forceCloseDeathScreen: () => void
		boxingGlovePunch: (touch_position: Vector3) => void
	},
	NotificationService: {
		sendNotification: (notification: INotification) => void
	},
	DataService: {
		updatePlayerCash: (cash: number) => void
	}
}

/*

	CLIENT TO SERVER

*/

interface ClientToServerFunctions {
	CartService: {
		getConfig: () => ProperReturns<ICartConfig>
		reset: () => void
		useProduct: (product_key: string) => ProperReturns<true>
		revive: (target: CFrame, stage: number) => ProperReturns<true>
	}
	
	CheckpointService: {
		tpMeToBigCheckpoint: () => ProperReturns<true>
		tpMeToCheckpoint: (checkpoint_index: number) => ProperReturns<true>
		getCheckpointState: () => ProperReturns<{
			current_checkpoint: number,
			collected_checkpoints: number[]
		}>
	}

	ShopService: {
		getShopConfig: () => ProperReturns<Record<string, IShopItem[]>>
		getShopItems: (item_type: IShopItemTypes) => ProperReturns<IShopItem[]>
		canPlayerAffordItem: (item_type: IShopItemTypes, item_name: string) => ProperReturns<boolean>
		makePlayerPurchaseItem: (item_type: IShopItemTypes, item_name: string) => ProperReturns<true>
		getPlayerInventory: (item_type: IShopItemTypes) => ProperReturns<IInventoryData>
		doesPlayerOwnItem: (item_type: IShopItemTypes, item_name: string) => ProperReturns<boolean>
	}

	CustomizationService: {
		getPlayerPreference: (item_type: string) => ProperReturns<string[]>
		setPreference: (key: string, value: string) => ProperReturns<true>
	}

	DataService: {
		getCash: () => ProperReturns<number>
	}
}
interface ClientToServerEvents {
	CartService: {
		spawnCart: (button: ButtonModel) => void,
		cleanupCart: () => void
		honk: () => void
	}
	CheckpointService: {
		setCheckpoint: (index: number) => void
		processPlayerDeath: () => void
	}
}

/*
EXPORT STUFF
*/
export const GlobalEvents = __IS_EDIT__
	? undefined
	: Networking.createEvent<ClientToServerEvents, ServerToClientEvents>()

// keep the castings, its for ui labs compatibility
export const ServerEvents = GlobalEvents?.createServer(
	{}
) as unknown as ServerHandler<ServerToClientEvents, ClientToServerEvents>
export const ClientEvents = GlobalEvents?.createClient(
	{}
) as unknown as ClientHandler<ClientToServerEvents, ServerToClientEvents>

export const GlobalFunctions = __IS_EDIT__
	? undefined
	: Networking.createFunction<
			ClientToServerFunctions,
			ServerToClientFunctions
		>()
export const ServerFunctions = (
	__IS_EDIT__ ? undefined : GlobalFunctions?.createServer({})
) as ServerHandlerFunction<ServerToClientFunctions, ClientToServerFunctions>
export const ClientFunctions = (
	__IS_EDIT__ ? undefined : GlobalFunctions?.createClient({})
) as ClientHandlerFunction<ClientToServerFunctions, ServerToClientFunctions>
