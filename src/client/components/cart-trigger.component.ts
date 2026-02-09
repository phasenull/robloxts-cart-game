import { BaseComponent, Component } from "@flamework/components"
import { TweenService } from "@rbxts/services"
import { t } from "@rbxts/t"
import { assets } from "shared/assets"
import { Logger } from "shared/logger"
interface CartTrigger extends Model {
	Trigger: BasePart
}
@Component({
	tag: "CartTriggerComponent"
})
export class CartTriggerComponent<
	ATTRIBUTES,
	INTERFACE extends CartTrigger
> extends BaseComponent<ATTRIBUTES, INTERFACE> {
	constructor(protected logger: Logger) {
		super()

		// for checkpoints, set it to 30
		this.instance.Trigger.Touched.Connect((part) => this.onTouch(part))
		logger.log(
			"Created CartTriggerComponent for " + this.instance.GetFullName()
		)
		const color_instance = new Instance("Color3Value", this.instance)
		color_instance.Name = "Color"
		this.color_instance = color_instance
		this.color_instance.Value = this.instance.Trigger.FindFirstChildOfClass("Beam")?.Color.Keypoints[0].Value || new Color3(1,1,1)
	}
	private color_instance: Color3Value
	setColor(color: Color3) {
		const tween = TweenService.Create(this.color_instance, new TweenInfo(0.1), {
			Value: color
		})
		tween.Play()
		this.color_instance.GetPropertyChangedSignal("Value").Connect(() => {
			this.instance.Trigger.GetChildren()
				.filter((child) => child.IsA("Beam"))
				.forEach((beam) => {
					beam.Color = new ColorSequence(this.color_instance.Value)
				})
		})
	}
	onTouch(touch_part: BasePart) {
		this.logger.log(
			`Interacted with ${this.instance.GetFullName()} by ${touch_part.GetFullName()}`
		)
	}
}
