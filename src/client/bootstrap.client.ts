
import { Flamework } from "@flamework/core"
import { Logger } from "shared/logger"
import { Centurion } from "@rbxts/centurion"
import { CenturionUI } from "@rbxts/centurion-ui"
import centurionTypes from "shared/centurion-types"
import { ClientFunctions } from "shared/network.helper"

const PREFIX = "bootstrap.client"
const logger = new Logger(PREFIX)

async function main() {
	Flamework.addPaths("src/client/controllers")
	Flamework.addPaths("src/client/components")
	Flamework.addPaths("src/shared/components")
	Flamework.ignite()
	logger.log("Flamework Ignited!")


	await centurionTypes(Centurion.client().registry)
	Centurion.client()
		.start()
		.then(() =>
			CenturionUI.start(Centurion.client(), {
				activationKeys: [Enum.KeyCode.F2]
			})
		)
		.catch((err) => warn("Failed to start Centurion:", err))
}
main()