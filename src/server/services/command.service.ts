import { Centurion } from "@rbxts/centurion"
import { Players } from "@rbxts/services"
import { Module, Service, type OnStart } from "@typetorch/framework"
import centurionTypes from "shared/common/centurion-types"
import { Logger } from "shared/common/logger"
import { network } from "shared/net"

/** The parts of Centurion's (1.0.1, pinned) ServerRegistry that `start()` uses through `init`. */
interface ServerRegistryInternals {
	syncedCommands: Map<Player, unknown>
	initialized: boolean
	config: { network: { syncStart: { Connect(this: void, callback: (player: Player) => void): unknown } } }
	sync(player: Player): void
	init(): void
}

/**
 * Admin commands (Centurion), started per generation. Centurion's transport runs over the game's network
 * (`network.centurion`) instead of the RemoteEvents/RemoteFunction it would create, and its registry's
 * PlayerRemoving connection is made in this module's trove instead of for the server's lifetime. Commands keep their
 * server-side `adminGuard`.
 */
@Service()
export class CommandService extends Module implements OnStart {
	private readonly logger = new Logger("bootstrap.server")

	onStart() {
		const server = Centurion.server({
			network: {
				syncStart: {
					Connect: (callback) => {
						this.trove.add(network.server.centurion.syncStart.on((player) => callback(player)))
						return undefined as unknown as RBXScriptConnection // Centurion doesn't keep it
					},
				},
				syncDispatch: {
					Fire: (player, data) => network.server.centurion.syncDispatch.fire(player, data),
				},
				execute: {
					SetCallback: (callback) => {
						this.trove.add(
							network.server.centurion.execute.handle((player, path, args) => [callback(player, path, args)])
						)
					},
				},
			},
		})
		this.driveRegistry(server.registry as unknown as ServerRegistryInternals)

		centurionTypes(server.registry).expect()
		const commandContainer = script.Parent!.Parent!.FindFirstChild("commands") as Folder
		this.logger.log("Loading commands from container:", commandContainer.GetFullName())
		server.registry.load(commandContainer)
		server.start()
	}

	/**
	 * ServerRegistry.init does BaseRegistry.init, then connects Players.PlayerRemoving for the server's lifetime (one
	 * leaked connection per generation, holding the old registry). Same steps here, with that connection in the trove.
	 */
	private driveRegistry(registry: ServerRegistryInternals) {
		const trove = this.trove
		const serverRegistry = getmetatable(registry) as object
		const baseRegistry = (getmetatable(serverRegistry) as { __index: { init: (self: ServerRegistryInternals) => void } })
			.__index
		registry.init = function (this: ServerRegistryInternals) {
			baseRegistry.init(this)
			trove.connect(Players.PlayerRemoving, (player) => this.syncedCommands.delete(player))
			this.config.network.syncStart.Connect((player) => this.sync(player))
			this.initialized = true
		}
	}
}
