import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { TweenService } from "@rbxts/services"
import { Logger } from "shared/logger"
import { BuildDeepWeldConstraints, BuildWeldConstraints, MasslessPart } from "shared/util.helper";

@Component({
	tag: "ElevatorComponent"
})
export class ElevatorComponent
	extends BaseComponent<
		{},
		Model & { Animate: Model; TargetCFrame: Attachment }
	>
	implements OnStart
{
	private readonly initial_cframe = this.instance.Animate.GetPivot()
	private readonly target_cframe = this.instance.TargetCFrame.WorldCFrame
	private readonly root:BasePart
	constructor(private logger: Logger) {
		super()
		this.root = MasslessPart(this.instance.Animate, "ElevatorRoot")
		this.root.PivotTo(this.instance.Animate.GetPivot())
		this.instance.Animate.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				BuildWeldConstraints(this.root, descendant)
				descendant.Anchored = false
			}
		})
		this.instance.Animate.PrimaryPart = this.root
		this.root.Anchored = true
	}
	progress(percentage: number) {
		const new_cframe = this.initial_cframe.Lerp(this.target_cframe, percentage)
		this.root.PivotTo(new_cframe)
	}
	tweenValue(target_percentage: number, duration: number) {
		
		const new_tween = TweenService.Create(
			this.number_value,
			new TweenInfo(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
			{ Value: target_percentage }
		)
		new_tween.Play()
		return new_tween
	}
	private readonly number_value = new Instance("NumberValue", this.instance)
	onStart() {
		this.number_value.Value = 0
		this.number_value.Changed.Connect(() => this.progress(this.number_value.Value))
		while (true) {
			this.tweenValue(1, 10).Completed.Wait()
			task.wait(5)
			this.tweenValue(0, 10).Completed.Wait()
			task.wait(5)

		}
	}
}
