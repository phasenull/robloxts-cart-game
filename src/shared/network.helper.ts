import { Networking } from "@flamework/networking";
import {
	ClientHandler,
	ServerHandler,
} from "@flamework/networking/out/events/types";
import {
	ClientHandler as ClientHandlerFunction,
	ServerHandler as ServerHandlerFunction,
} from "@flamework/networking/out/functions/types";
import { __IS_CLIENT__, __IS_EDIT__, __IS_SERVER__ } from "./config.helper";
import { Logger } from "./logger";
import { ButtonModel } from "./type.helper";
/*

	SERVER TO CLIENT

*/
interface ServerToClientFunctions {}
interface ServerToClientEvents {}

/*

	CLIENT TO SERVER

*/

interface ClientToServerFunctions {}
interface ClientToServerEvents {
	CartService: {
		spawnCart: (button: ButtonModel) => void;
	};
}

/*
EXPORT STUFF
*/
const logger = new Logger("network.helper");
logger.log(`is_edit: ${__IS_EDIT__} is_server: ${__IS_SERVER__} is_client: ${__IS_CLIENT__}`)
export const GlobalEvents = __IS_EDIT__
	? undefined
	: Networking.createEvent<ClientToServerEvents, ServerToClientEvents>();

// keep the castings, its for ui labs compatibility
export const ServerEvents = GlobalEvents?.createServer(
	{},
) as unknown as ServerHandler<ServerToClientEvents, ClientToServerEvents>;
export const ClientEvents = GlobalEvents?.createClient(
	{},
) as unknown as ClientHandler<ClientToServerEvents, ServerToClientEvents>;

export const GlobalFunctions = __IS_EDIT__
	? undefined
	: Networking.createFunction<
			ClientToServerFunctions,
			ServerToClientFunctions
		>();
export const ServerFunctions = (
	__IS_EDIT__ ? undefined : GlobalFunctions?.createServer({})
) as ServerHandlerFunction<ServerToClientFunctions, ClientToServerFunctions>;
export const ClientFunctions = (
	__IS_EDIT__ ? undefined : GlobalFunctions?.createClient({})
) as ClientHandlerFunction<ClientToServerFunctions, ServerToClientFunctions>;