import { BaseComponent, Component } from "@flamework/components"
import {
	BuildWeldConstraints,
	MasslessPart,
	TweenValue
} from "shared/util.helper"

@Component({
	tag: "BoxingGlovesComponent"
})
export class BoxingGlovesComponent extends BaseComponent<{}, Model> {
	constructor() {
		super()
		const root = MasslessPart(this.instance, "Root")
		root.CanCollide = false
		root.PivotTo(this.instance.GetPivot())
		root.Anchored = true
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant === root) {
				return
			}
			if (descendant.IsA("BasePart")) {
				descendant.CanCollide = true
				descendant.Massless = true
				descendant.Anchored = false
				descendant.CollisionGroup = "Spike"
				BuildWeldConstraints(root, descendant)
			}
		})
		const cached_pivot = root.GetPivot()
		this.thread = task.spawn(() => {
			while (this.instance) {
				const punch_tween = TweenValue(
					new TweenInfo(
						0.5,
						Enum.EasingStyle.Elastic,
						Enum.EasingDirection.Out
					),
					(alpha) => {
						const punch_offset = 40 * alpha
						root.CFrame = cached_pivot.mul(new CFrame(-punch_offset, 0, 0))
					}
				)
				punch_tween.Completed.Wait()
				task.wait(3)
				const return_tween = TweenValue(
					new TweenInfo(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
					(alpha) => {
						const punch_offset = 40 * (1-alpha)
						root.CFrame = cached_pivot.mul(new CFrame(-punch_offset, 0, 0))
					}
				)
				return_tween.Completed.Wait()
				task.wait(5)
			}
		})
	}
	private readonly thread: thread
	cleanup(): void {
		if (this.thread) {
			task.cancel(this.thread)
		}
		this.instance.Destroy()
	}
}
