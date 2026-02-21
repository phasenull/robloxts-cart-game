import { Modding } from "@flamework/core";
import { LogService, RunService } from "@rbxts/services";
import { capitalizeFirstLetter } from "./util.helper";

export interface LogEntry {
	created_at: number;
	job_id: string;
	published_version: number;
	context: string;
	message: string;
	type: string;
}


/** Called by HttpService on the server to wire up remote log shipping. */

type logType = (string | number)[];
export class Logger {
	constructor(private context: string) {}
	public log(...args: logType) {
		const message = args.join(" ");
		print(`[INFO] [${this.context}]:`, message);
	}
	public warn(...args: logType) {
		const message = args.join(" ");
		warn(`[WARN] [${this.context}]:`, message);
	}
	public error(...args: logType) {
		const message = args.join(" ");
		error(`[ERROR] [${this.context}]: ` + message);
	}
}
Modding.registerDependency<Logger>((constructor) => {
	const is_service = tostring(constructor).find("Service")[0];
	const is_controller = tostring(constructor).find("Controller")[0];
	const is_component = tostring(constructor).find("Component")[0];
	const log_type = is_service
		? "service"
		: is_controller
			? "controller"
			: is_component
				? "component"
				: "unknown";
	const capitalized = capitalizeFirstLetter(log_type);
	if (log_type !== "unknown") {
		const service_name = tostring(constructor).split(capitalized)[0].lower();
		return new Logger(`${service_name}.${log_type}`);
	}
	return new Logger(tostring(constructor));
});