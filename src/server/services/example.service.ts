import { OnStart, Service } from "@flamework/core"
import { Logger } from "shared/logger"

@Service()
export class ExampleService implements OnStart {
	constructor(private logger: Logger) {}
	onStart(): void {
		this.logger.log("ExampleService has started!")
	}
}
