import { TweenService } from "@rbxts/services"
import type { Trove } from "@rbxts/trove"
import { Logger } from "shared/common/logger"
import { rigOnce, TaggedComponent } from "shared/component"

interface CartTrigger extends Model {
	Trigger: BasePart
}

/**
 * Tag "CartTriggerComponent" (Model with a Trigger part): calls onTouch on touches and tints the trigger's beams.
 * The Color3Value the beams follow is world setup on the model, handed over between generations.
 */
export class CartTriggerComponent<INTERFACE extends CartTrigger = CartTrigger> extends TaggedComponent<INTERFACE> {
	protected logger = new Logger("carttrigger.component")
	private color_instance: Color3Value
	constructor(instance: INTERFACE, trove: Trove) {
		super(instance, trove)

		// for checkpoints, set it to 30
		this.trove.connect(this.instance.Trigger.Touched, (part) => this.onTouch(part))
		// logger.log(
		// 	"Created CartTriggerComponent for " + this.instance.GetFullName()
		// )
		const beam = this.instance.Trigger.FindFirstChildOfClass("Beam")
		rigOnce(this.instance, "carttrigger", () => {
			const color_instance = new Instance("Color3Value", this.instance)
			color_instance.Name = "Color"
			if (beam) {
				const w = this.instance.Trigger.Size.X
				beam.Width0 = w
				beam.Width1 = w
			}
			color_instance.Value = beam?.Color.Keypoints[0].Value || new Color3(1, 1, 1)
		})
		this.color_instance = this.instance.FindFirstChild("Color") as Color3Value
		this.trove.connect(this.color_instance.GetPropertyChangedSignal("Value"), () => {
			this.instance.Trigger.GetChildren()
				.filter((child) => child.IsA("Beam"))
				.forEach((beam) => {
					beam.Color = new ColorSequence(this.color_instance.Value)
				})
		})
	}
	setColor(color: Color3) {
		const tween = TweenService.Create(this.color_instance, new TweenInfo(0.2), {
			Value: color
		})
		tween.Play()
	}
	onTouch(touch_part: BasePart) {
		this.logger.log(
			`Interacted with ${this.instance.GetFullName()} by ${touch_part.GetFullName()}`
		)
	}
}
