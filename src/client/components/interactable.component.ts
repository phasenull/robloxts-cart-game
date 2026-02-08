import { BaseComponent, Component } from "@flamework/components";
import { t } from "@rbxts/t";
import { Logger } from "shared/logger";
interface InteractableModel extends Model {
	Attachment: Attachment
	Collider : BasePart
}
@Component({ tag: "InteractableComponent",instanceGuard: t.instanceIsA("Model") })
export class InteractableComponent extends BaseComponent<{},InteractableModel> {
	constructor (private logger: Logger) {
		super()
		const part = new Instance("Part")
		part.Size = new Vector3(1, 1, 1)
		part.Name = "Collider"
		part.Transparency = 1
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = true
		part.CFrame = this.instance.Attachment.WorldCFrame.add(new Vector3(0,5,0))
		part.Orientation = new Vector3(0, 0, 90)
		part.Anchored = true
		part.Parent = this.instance
		this.setRange(10) // for mini boosts, 10 is fine
		// for checkpoints, set it to 30
		logger.log(`Created InteractableComponent for ${this.instance.GetFullName()}`)
	}
	private range = 0
	setRange(range: number) {
		this.range = range
		this.instance.Collider.Size = new Vector3(8,range,range)
		this.instance.Collider.CFrame = this.instance.Attachment.WorldCFrame.add(new Vector3(0,range/2,0))
	}
	private state : "enabled" | "disabled" = "enabled"
	enable() {
		this.state = "enabled"
	}
	disable() {
		this.state = "disabled"
	}
	private __default_debounce : number | undefined = undefined
	private __default_filterer?: (part: BasePart) => boolean
	setDefaultDebounce(debounce_duration: number,filterer?: (part: BasePart) => boolean) {
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
	bindTouchEvent(callback: (touch_part: BasePart) => void) {
		const connection = this.instance.Collider.Touched.Connect((part) => {
			if (this.state === "disabled") {
				return
			}
			let can_access = true
			const def_bounce = this.__default_debounce
			if (def_bounce) {
				const should_filter = this.__default_filterer ? this.__default_filterer(part) : true
				if (!should_filter) {
					return
				}
				can_access = this.applyCooldown(def_bounce)
			}
			if (!can_access) {
				return
			}
			if (part.CanQuery) {
				callback(part)
			}
		})
		return () => {
			connection.Disconnect()
		}
	}
}