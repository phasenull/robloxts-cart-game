import { Networking } from "@flamework/networking"
import { MovementDirection, Party, ProperReturns } from "./type.helper"
import { PlotData } from "./plot-state"
import { __IS_EDIT__ } from "./config.helper"
import {
	ClientHandler as ClientHandlerFunction,
	GlobalFunction,
	ServerHandler as ServerHandlerFunction
} from "@flamework/networking/out/functions/types"
import {
	ClientHandler,
	ServerHandler
} from "@flamework/networking/out/events/types"
/*

	SERVER TO CLIENT

*/
interface ServerToClientFunctions {}
interface ServerToClientEvents {
	PartyService: {
		partyUpdated: (new_party: Party | undefined, message?: string) => void
	}
	PlotService: {
		replicate: <T extends PlotData | undefined>(
			guid: string,
			data: T,
			hint: keyof PlotData | "full"
		) => void
	}
	LogService: {
		setTargetAttachment: (attachment: Attachment | undefined) => void
	}
}

/*

	CLIENT TO SERVER

*/

interface ClientToServerFunctions {
	PartyService: {
		createParty: () => ProperReturns<Party>
		inviteToParty: (player: Player) => ProperReturns<true>
		getAvailableParties: () => ProperReturns<Party[]>
		leaveParty: () => ProperReturns<true>
		joinParty: (party_id: string) => ProperReturns<Party>

		changeVisibility: (is_public: boolean) => ProperReturns<true>
		kickFromParty: (player: Player) => ProperReturns<true>
		promoteToOwner: (player: Player) => ProperReturns<true>

		startPartyMatchmaking: () => ProperReturns<true>

		getPartyState: () => ProperReturns<Party | undefined>
	}
	PlotService: {
		requestPlotReplication: (guid: string) => PlotData | undefined
	}
}
interface ClientToServerEvents {
	LogService: {
		setMovementDirection: (direction: MovementDirection, hint?: Model) => void
	},
	CartService: {
		spawnCart: (button: Model) => void
	}
}

/*
EXPORT STUFF
*/
print("isEdit:", __IS_EDIT__)
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
