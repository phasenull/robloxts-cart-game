import { LogService, RunService } from "@rbxts/services";

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
