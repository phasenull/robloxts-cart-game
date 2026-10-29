import { Players } from "@rbxts/services"
import type { Trove } from "@rbxts/trove"
import { TaggedComponent } from "shared/component"

/** The outermost Model above `instance` (a cart's or a character's). */
function recurseUntilModel(instance: Instance): Model | undefined {
	const model = instance.FindFirstAncestorOfClass("Model")
	if (!model) return
	return recurseUntilModel(model) || model
}

/**
 * Tag "CartTouchComponent": calls onTouch when a part of a cart model touches the instance's touch part, and
 * onCharacterTouch when a player's character does.
 */
export class CartTouch<T extends Instance = BasePart> extends TaggedComponent<T> {
	public touch_part: BasePart
	constructor(instance: T, trove: Trove) {
		super(instance, trove)
		const touch_part = this.instance.IsA("Model")
			? this.instance.FindFirstChild("Trigger") ||
				(this.instance.PrimaryPart as BasePart) || this.instance.FindFirstChildOfClass("BasePart")
			: (this.instance)
		if (!touch_part || !touch_part.IsA("BasePart")) {
			error(`CartTouchComponent must be attached to a Model with a BasePart child or a BasePart. Failed to find touch part for ${this.instance.GetFullName()}`)
		}
		this.touch_part = touch_part
		this.trove.connect(touch_part.Touched, (other_part) => this.handleTouch(other_part))
	}
	/** Routes a part touching the touch part to onTouch (a cart's part) or onCharacterTouch (a player's character). */
	handleTouch(other_part: BasePart) {
		const model = recurseUntilModel(other_part)
		if (!model) return
		if (model.HasTag("CartComponent")) {
			this.onTouch(other_part, model)
			return
		}
		const player = Players.GetPlayerFromCharacter(model)
		if (player) this.onCharacterTouch(other_part, model, player)
	}
	onTouch(other_part: BasePart, cart_model: Model) {}
	onCharacterTouch(other_part: BasePart, character: Model, player: Player) {}
}
