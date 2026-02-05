import { Component } from "@flamework/components";

@Component({tag: "CapsuleComponent"})
export class ThingCapsuleComponent {
	private model : Model | undefined
	private level : number = 0
	private earnedCash : number = 0
	setModel(model: Model | undefined) {
		if (this.model) {
			this.model.Destroy()
		}
		this.model = model
	}
	setLevel(level: number) {
		this.level = level
	}
	setEarnedCash(amount: number) {

	}
	cleanup() {
		this.setModel(undefined)
	}
}