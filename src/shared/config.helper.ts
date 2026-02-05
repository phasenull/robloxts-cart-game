import { RunService, ServerScriptService } from "@rbxts/services";
export interface IConfig {
	
}

export const __IS_STUDIO__ = RunService.IsStudio()
export const __IS_SERVER__ = RunService.IsServer()
export const __IS_CLIENT__ = RunService.IsClient()
export const __IS_EDIT__ = !RunService.IsRunning()

export function getConfig(): IConfig {
	const config = require(ServerScriptService.FindFirstChild("Config") as ModuleScript) as IConfig;
	return config;
}
