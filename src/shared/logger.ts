import { Modding } from "@flamework/core";
import { LogService, RunService } from "@rbxts/services";
import { capitalizeFirstLetter } from "./util.helper";

export interface LogEntry {
	created_at: string;
	job_id: string;
	published_version: number;
	context: string;
	message: string;
	type: string;
}

type LogSink = (entry: LogEntry) => void;
let logSink: LogSink | undefined;

/** Called by HttpService on the server to wire up remote log shipping. */
export function setLogSink(sink: LogSink): void {
	logSink = sink;
}

function buildEntry(context: string, type_str: string, message: string): LogEntry {
	return {
		created_at: DateTime.now().ToIsoDate(),
		job_id: game.JobId,
		published_version: game.PlaceVersion,
		context,
		message,
		type: type_str,
	};
}

type logType = (string | number)[];
export class Logger {
	constructor(private context: string) {}
	public log(...args: logType) {
		const message = args.join(" ");
		print(`[INFO] [${this.context}]:`, message);
		if (RunService.IsServer() && logSink) {
		}
	}
	public warn(...args: logType) {
		const message = args.join(" ");
		warn(`[WARN] [${this.context}]:`, message);
		if (RunService.IsServer() && logSink) {
			logSink(buildEntry(this.context, "warn", message));
		}
	}
	public error(...args: logType) {
		const message = args.join(" ");
		if (RunService.IsServer() && logSink) {
			logSink(buildEntry(this.context, "error", message));
		}
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
LogService.MessageOut.Connect((message, message_type) => {
	if (RunService.IsServer() && logSink) {
		if (!["MessageWarning", "MessageError"].includes(message_type.Name)) {
			return;
		}
		const type_str =
			message_type === Enum.MessageType.MessageWarning ? "warn" : "error";
		logSink(buildEntry("unknown", type_str, message));
	}
});
