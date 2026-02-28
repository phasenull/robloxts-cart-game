import { Flamework } from "@flamework/core";
import { Centurion } from "@rbxts/centurion";
import centurionTypes from "@common/shared/centurion-types";
import { Logger as logger_class } from "@common/shared/logger";

const PREFIX = "bootstrap.server";
const logger = new logger_class(PREFIX);
async function main() {
	Flamework.addPaths("src/server/services");
	Flamework.addPaths("src/server/components");
	Flamework.addPaths("src/shared/components");
	Flamework.addPaths("src/common/server");
	Flamework.ignite();
	logger.log("Flamework Ignited!");

	const server = Centurion.server();
	await centurionTypes(server.registry);
	const commandContainer = script.Parent!.FindFirstChild("commands") as Folder;
	logger.log(
		"Loading commands from container:",
		commandContainer.GetFullName(),
	);
	server.registry.load(commandContainer);
	server.start();
}
main();
