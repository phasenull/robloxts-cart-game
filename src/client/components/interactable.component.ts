import { BaseComponent, Component } from "@flamework/components"
import { t } from "@rbxts/t"
import { assets } from "shared/assets"
import { Logger } from "shared/logger"
interface InteractableModel extends Model {
	Attachment: Attachment
	Collider: BasePart
}
@Component({
	tag: "InteractableComponent",
	instanceGuard: t.instanceIsA("Model")
})
export class InteractableComponent extends BaseComponent<
	{},
	InteractableModel
> {
	private readonly checkpoint_visual: Model & { checkpoint_visual: Part }
	constructor(protected logger: Logger) {
		super()
		const part = new Instance("Part")
		part.Size = new Vector3(1, 1, 1)
		part.Name = "Collider"
		part.Transparency = 1
		const checkpoint_visual = assets.CheckpointVisuals.Clone()
		checkpoint_visual.Name = "CheckpointVisual"
		this.checkpoint_visual = checkpoint_visual
		checkpoint_visual.Parent = this.instance
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = true
		part.Shape = Enum.PartType.Cylinder
		part.CFrame = this.instance.Attachment.WorldCFrame.add(new Vector3(0, 5, 0))
		part.Orientation = new Vector3(0, 0, 90)
		part.Anchored = true
		checkpoint_visual.checkpoint_visual.Anchored = true
		part.Parent = this.instance
		this.setRange(10) // for mini boosts, 10 is fine
		// for checkpoints, set it to 30
		part.Touched.Connect((part) => this.onTouch(part))
		logger.log(
			`Created InteractableComponent for ${this.instance.GetFullName()}`
		)
	}
	private range = 0
	setRange(range: number) {
		this.range = range
		this.instance.Collider.Size = new Vector3(8, range, range)
		this.instance.Collider.CFrame = this.instance.Attachment.WorldCFrame.add(
			new Vector3(0, 3.95, 0)
		)
		const model = this.checkpoint_visual
		// const current_scale_factor = this.checkpoint_visual.checkpoint_visual.Size.X/model.GetScale()
		const desired_scale_factor = (range)/model.checkpoint_visual.Size.X
		// const scale_factor = desired_scale_factor/current_scale_factor
		model.ScaleTo(desired_scale_factor)
		
	}
	setColor(color: Color3) {
		this.checkpoint_visual
		this.checkpoint_visual.GetChildren().forEach((child) => {
			if (child.IsA("Beam")) {
				child.Color = new ColorSequence(color)
			}
		})
	}
	private state: "enabled" | "disabled" = "enabled"
	enable() {
		this.state = "enabled"
	}
	disable() {
		this.state = "disabled"
	}
	private __default_debounce: number | undefined = undefined
	private __default_filterer?: (part: BasePart) => boolean
	setDefaultDebounce(
		debounce_duration: number,
		filterer?: (part: BasePart) => boolean
	) {
		this.__default_debounce = debounce_duration
		this.__default_filterer = filterer
	}
	applyCooldown(duration: number) {
		if (this.state === "disabled") {
			return false
		}
		this.disable()
		task.delay(duration, () => {
			this.enable()
		})
		return true
	}
	onTouch(touch_part: BasePart) {
		this.logger.log(
			`Interacted with ${this.instance.GetFullName()} by ${touch_part.GetFullName()}`
		)
	}
	// bindTouchEvent(callback: (touch_part: BasePart) => void) {
	// 	const connection = this.instance.Collider.Touched.Connect((part) => {
	// 		if (this.state === "disabled") {
	// 			return
	// 		}
	// 		let can_access = true
	// 		const def_bounce = this.__default_debounce
	// 		if (def_bounce) {
	// 			const should_filter = this.__default_filterer ? this.__default_filterer(part) : true
	// 			if (!should_filter) {
	// 				return
	// 			}
	// 			can_access = this.applyCooldown(def_bounce)
	// 		}
	// 		if (!can_access) {
	// 			return
	// 		}
	// 		if (part.CanQuery) {
	// 			callback(part)
	// 		}
	// 	})
	// 	return () => {
	// 		connection.Disconnect()
	// 	}
	// }
}
