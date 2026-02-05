import { Networking } from "@flamework/networking"
import {
	ClientHandler,
	ServerHandler
} from "@flamework/networking/out/events/types"
import {
	ClientHandler as ClientHandlerFunction,
	ServerHandler as ServerHandlerFunction
} from "@flamework/networking/out/functions/types"
import { __IS_EDIT__ } from "./config.helper"
/*

	SERVER TO CLIENT

*/
interface ServerToClientFunctions {}
interface ServerToClientEvents {
}

/*

	CLIENT TO SERVER

*/

interface ClientToServerFunctions {

}
interface ClientToServerEvents {

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
