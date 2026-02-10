import { BaseComponent, Component } from "@flamework/components";

@Component({ tag: "CartTouchComponent" })
export class CartTouch extends BaseComponent<{}, BasePart> {
	constructor() {
		super()
		function recurseUntilModel(instance: Instance): Model | undefined {
			const model = instance.FindFirstAncestorOfClass("Model")
			if (!model) return
			return recurseUntilModel(model) || model


		}
		this.instance.Touched.Connect((other_part) => {
			const model = recurseUntilModel(other_part)
			if (!model) return
			const cart_tag = model.GetTags().find((tag) => tag === "CartComponent")
			if (!cart_tag) return
			this.onTouch(other_part,model)
		})
	}
	onTouch(other_part: BasePart,cart_model: Model) {
		
	}
}