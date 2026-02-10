import { ReplicatedFirst, RunService, ServerScriptService, UserInputService } from "@rbxts/services";
import { IConfig } from "./type.helper";


export const __IS_STUDIO__ = RunService.IsStudio()
export const __IS_SERVER__ = RunService.IsServer()
export const __IS_CLIENT__ = RunService.IsClient()
export const __IS_EDIT__ = !RunService.IsRunning()
export function getConfig(): IConfig {
	const module = ReplicatedFirst.FindFirstChild("Config") as ModuleScript
	assert(module, "Config module not found in ReplicatedFirst")
	const config = require(module) as IConfig;
	return config;
}
