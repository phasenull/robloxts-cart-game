import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { TweenService, Workspace } from "@rbxts/services"
import { Logger } from "shared/logger"
import {
	BuildDeepWeldConstraints,
	BuildWeldConstraints,
	MasslessPart
} from "shared/util.helper"

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
	private readonly root: BasePart
	private readonly align_position: AlignPosition
	private readonly align_target: Attachment
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
		this.align_position = new Instance("AlignPosition", this.root)
		this.align_position.Attachment0 = new Instance("Attachment", this.root)
		this.align_position.Attachment0.Name = "AlignPositionAttachment"
		this.align_target = new Instance(
			"Attachment",
			Workspace.FindFirstChild("runtime") as Folder
		)
		this.align_target.Name = "ElevatorAlignTarget"
		this.align_target.WorldCFrame = this.target_cframe
		this.align_position.Attachment1 = this.align_target
		// this.align_position.RigidityEnabled = true
		this.align_position.MaxForce = math.huge
		this.align_position.Responsiveness = 5
		this.align_position.MaxVelocity = 20
		this.align_position.RigidityEnabled = true
		const align_orientation = new Instance("AlignOrientation", this.root)
		align_orientation.Attachment0 = new Instance("Attachment", this.root)
		align_orientation.Attachment0.Name = "AlignOrientationAttachment"
		align_orientation.Mode = Enum.OrientationAlignmentMode.OneAttachment
		align_orientation.RigidityEnabled = true
		align_orientation.MaxTorque = math.huge
		align_orientation.PrimaryAxis = new Vector3(0, 0, -1)
		align_orientation.Responsiveness = 3
	}
	// progress(percentage: number) {
	// 	const new_cframe = this.initial_cframe.Lerp(this.target_cframe, percentage)
	// 	this.root.PivotTo(new_cframe)
	// }
	// tweenValue(target_percentage: number, duration: number) {

	// 	const new_tween = TweenService.Create(
	// 		this.number_value,
	// 		new TweenInfo(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
	// 		{ Value: target_percentage }
	// 	)
	// 	new_tween.Play()
	// 	return new_tween
	// }
	private readonly wait_duration = 5
	private readonly tween_duration = 10

	// private readonly number_value = new Instance("NumberValue", this.instance)
	onStart() {
		// this.number_value.Value = 0
		// this.number_value.Changed.Connect(() => this.progress(this.number_value.Value))
		while (true) {
			const tween_init = TweenService.Create(
				this.align_target,
				new TweenInfo(
					this.tween_duration,
					Enum.EasingStyle.Quad,
					Enum.EasingDirection.InOut
				),
				{
					WorldCFrame: this.target_cframe.mul(CFrame.Angles(0, math.rad(90), 0))
				}
			)
			tween_init.Play()
			tween_init.Completed.Wait()
			task.wait(this.wait_duration)
			const tween = TweenService.Create(
				this.align_target,
				new TweenInfo(
					this.tween_duration,
					Enum.EasingStyle.Quad,
					Enum.EasingDirection.InOut
				),
				{
					WorldCFrame: this.initial_cframe.mul(CFrame.Angles(0, math.rad(90), 0))
				}
			)
			tween.Play()
			tween.Completed.Wait()
			task.wait(this.wait_duration)
		}
	}
}
