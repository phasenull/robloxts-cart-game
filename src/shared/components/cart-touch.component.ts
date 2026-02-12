import { BaseComponent, Component } from "@flamework/components"

@Component({ tag: "CartTouchComponent" })
export class CartTouch<T extends Instance = BasePart> extends BaseComponent<
	{},
	T
> {
	public touch_part: BasePart
	constructor() {
		super()
		function recurseUntilModel(instance: Instance): Model | undefined {
			const model = instance.FindFirstAncestorOfClass("Model")
			if (!model) return
			return recurseUntilModel(model) || model
		}
		const touch_part = this.instance.IsA("Model")
			? this.instance.FindFirstChild("Trigger") ||
				(this.instance.PrimaryPart as BasePart) || this.instance.FindFirstChildOfClass("BasePart")
			: (this.instance)
		if (!touch_part || !touch_part.IsA("BasePart")) {
			error(`CartTouchComponent must be attached to a Model with a BasePart child or a BasePart. Failed to find touch part for ${this.instance.GetFullName()}`)
		}
		this.touch_part = touch_part
		touch_part.Touched.Connect((other_part) => {
			const model = recurseUntilModel(other_part)
			if (!model) return
			const cart_tag = model.GetTags().find((tag) => tag === "CartComponent")
			if (!cart_tag) return
			this.onTouch(other_part, model)
		})
	}
	onTouch(other_part: BasePart, cart_model: Model) {}
}
