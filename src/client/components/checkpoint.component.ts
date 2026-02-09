import { Component } from "@flamework/components";
import { InteractableComponent } from "./interactable.component";
import { Logger } from "shared/logger";

@Component({ tag: "CheckpointComponent" })
export class CheckpointComponent extends InteractableComponent {
	constructor() {
		super(new Logger("CheckpointComponent"))
		this.setRange(30)

	}
	onTouch(touch_part: BasePart): void {
		 this.logger.log(`Checkpoint reached at ${this.instance.GetFullName()} by ${touch_part.GetFullName()}`)
	}
}