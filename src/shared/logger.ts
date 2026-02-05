import { Modding } from "@flamework/core"
import { capitalizeFirstLetter } from "./util.helper"

type logType = (string | number)[]
export class Logger {
	constructor(private context: string) {}
	public log(...args: logType) {
		print(`[INFO] [${this.context}]:`, ...args)
	}
	public warn(...args: logType) {
		warn(`[WARN] [${this.context}]:`, ...args)
	}
	public error(...args: logType) {
		error(`[ERROR] [${this.context}]: ` + args.join(" "))
	}
}
Modding.registerDependency<Logger>((constructor) => {
	const is_service = tostring(constructor).find("Service")[0]
	const is_controller = tostring(constructor).find("Controller")[0]
	const is_component = tostring(constructor).find("Component")[0]
	const log_type = is_service
		? "service"
		: is_controller
		? "controller"
		: is_component
		? "component"
		: "unknown"
	const capitalized = capitalizeFirstLetter(log_type)
	if (log_type !== "unknown") {
		const service_name = tostring(constructor)
			.split(capitalized)[0]
			.lower()
		return new Logger(`${service_name}.${log_type}`)
	}
	return new Logger(tostring(constructor))
})
