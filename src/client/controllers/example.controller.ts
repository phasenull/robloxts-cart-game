import { Controller, OnStart } from "@flamework/core";
import { Logger } from "shared/logger";

@Controller()
export class ExampleController implements OnStart{
	constructor(private logger: Logger) {
	}
	onStart(): void {
		 this.logger.log("ExampleController has started!");
	}
}