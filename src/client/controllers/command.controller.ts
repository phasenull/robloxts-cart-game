import { Centurion, CenturionType, type CommandContextData } from "@rbxts/centurion"
import { CenturionUI, DefaultPalette } from "@rbxts/centurion-ui"
import { CenturionApp } from "@rbxts/centurion-ui/out/app/centurion-app"
import { Players, RunService } from "@rbxts/services"
import Vide from "@rbxts/vide"
import { Controller, Module, type OnStart } from "@typetorch/framework"
import centurionTypes from "shared/common/centurion-types"
import { Logger } from "shared/common/logger"
import { network } from "shared/net"

/**
 * The admin terminal (Centurion client + CenturionUI, F2), per generation. Centurion talks over the game's network
 * (`network.centurion`), and the terminal is mounted here instead of through CenturionUI.start, which keeps no handle
 * to unmount it: the Vide root is destroyed with this module's trove, and Vide is stepped from the trove (its own
 * module-level Heartbeat stepper would stay connected once per swap).
 */
@Controller()
export class CommandController extends Module implements OnStart {
	private readonly logger = new Logger("bootstrap.client")

	onStart() {
		// Stepping Vide ourselves disconnects its own stepper (vide.step).
		this.trove.connect(RunService.Heartbeat, (dt) => Vide.step(dt))

		const client = Centurion.client({
			network: {
				syncStart: {
					Fire: () => network.client.centurion.syncStart.fire(),
				},
				syncDispatch: {
					Connect: (callback) => {
						this.trove.add(
							network.client.centurion.syncDispatch.on((data) => callback(data as Parameters<typeof callback>[0]))
						)
					},
				},
				execute: {
					// Centurion calls this inside a pcall and turns a throw into its error reply.
					Invoke: (path, args) => {
						const [data, reason] = network.client.centurion.execute.invoke(path, args).expect()
						if (data === false) error(reason)
						return data as CommandContextData
					},
				},
			},
		})

		const [ok, err] = pcall(() => {
			centurionTypes(client.registry).expect()
			client.start().expect()
			this.startTerminal(client)
		})
		if (!ok) warn("Failed to start Centurion:", err)
		this.logger.log("Centurion client started")
	}

	/** CenturionUI.start, with the unmount kept: built-in `theme` command, options, then the Vide mount. */
	private startTerminal(client: ReturnType<typeof Centurion.client>) {
		if (client.config.registerBuiltInCommands) {
			client.registry.registerCommand(
				{
					name: "theme",
					description: "Change the terminal's theme",
					arguments: [
						{
							name: "name",
							description: "The name of the theme",
							type: CenturionType.String,
							suggestions: ["mocha", "macchiato", "frappe", "latte"],
						},
					],
				},
				(ctx, theme: string) => {
					const palette = DefaultPalette[theme as keyof typeof DefaultPalette]
					if (palette === undefined) {
						ctx.error("Invalid theme")
						return
					}
					CenturionUI.updateOptions({ palette })
					ctx.reply(`Set theme to '${theme}'`)
				},
				["centurion"],
			)
		}
		CenturionUI.updateOptions({ activationKeys: [Enum.KeyCode.F2] })
		const unmount = Vide.mount(() => CenturionApp(client), Players.LocalPlayer.WaitForChild("PlayerGui"))
		this.trove.add(unmount)
	}
}
