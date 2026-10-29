import type { Trove } from "@rbxts/trove"
import { TaggedComponent } from "shared/component"

/** Tag "CartTouchComponent": calls onTouch when a part of a cart model touches the instance's touch part. */
export class CartTouch<T extends Instance = BasePart> extends TaggedComponent<T> {
	public touch_part: BasePart
	constructor(instance: T, trove: Trove) {
		super(instance, trove)
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
		this.trove.connect(touch_part.Touched, (other_part) => {
			const model = recurseUntilModel(other_part)
			if (!model) return
			const cart_tag = model.GetTags().find((tag) => tag === "CartComponent")
			if (!cart_tag) return
			this.onTouch(other_part, model)
		})
	}
	onTouch(other_part: BasePart, cart_model: Model) {}
}
