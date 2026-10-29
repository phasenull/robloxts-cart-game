import {
	ReplicatedFirst,
	RunService,
	ServerScriptService,
} from "@rbxts/services";

export const __IS_STUDIO__ = RunService.IsStudio();
export const __IS_SERVER__ = RunService.IsServer();
export const __IS_CLIENT__ = RunService.IsClient();
export const __IS_EDIT__ = !RunService.IsRunning();

export function buildConfigGetter<T>(): T {
	const module = ReplicatedFirst.FindFirstChild("Config") as ModuleScript;
	assert(module, "Config module not found in ReplicatedFirst");
	const config = require(module) as T;
	return config;
}
