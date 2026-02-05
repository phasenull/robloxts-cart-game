import { Component } from "@flamework/components"
import { Logger } from "shared/logger";

@Component()
export class ExampleComponent {
	constructor(private logger: Logger) {
		this.logger.log("ExampleComponent has been constructed!");
	}
}
