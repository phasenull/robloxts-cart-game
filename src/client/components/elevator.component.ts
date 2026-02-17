import { BaseComponent, Component } from "@flamework/components"
import { OnStart } from "@flamework/core"
import { TweenService, Workspace } from "@rbxts/services"
import { Logger } from "shared/logger"
import {
	BuildWeldConstraints
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
		// Create root part with mass so it becomes the physics assembly root
		const root = new Instance("Part", this.instance.Animate)
		root.Size = new Vector3(1, 1, 1)
		root.Name = "ElevatorRoot"
		root.Transparency = 1
		root.CanCollide = false
		root.Anchored = true // Keep anchored until constraints are ready
		root.Massless = false
		const temp_root = this.instance.Animate.FindFirstChild("Root")
		if (temp_root && temp_root.IsA("BasePart")) {
			temp_root.Anchored = false
		}
		this.root = root
		this.root.PivotTo(this.instance.Animate.GetPivot())
		this.instance.Animate.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart") && descendant !== this.root) {
				BuildWeldConstraints(this.root, descendant)
				descendant.Anchored = false
			}
		})
		this.instance.Animate.PrimaryPart = this.root

		// Setup AlignPosition
		this.align_position = new Instance("AlignPosition", this.root)
		this.align_position.Attachment0 = new Instance("Attachment", this.root)
		this.align_position.Attachment0.Name = "AlignPositionAttachment"
		// Parent to a BasePart so the constraint solver can resolve it
		this.align_target = new Instance(
			"Attachment",
			Workspace.FindFirstChild("runtime") as BasePart
		)
		this.align_target.Name = "ElevatorAlignTarget"
		this.align_target.WorldCFrame = this.initial_cframe
		this.align_position.Attachment1 = this.align_target
		this.align_position.MaxForce = math.huge
		this.align_position.Responsiveness = 5
		this.align_position.MaxVelocity = 20
		this.align_position.RigidityEnabled = true

		// Setup AlignOrientation
		const align_orientation = new Instance("AlignOrientation", this.root)
		align_orientation.Attachment0 = new Instance("Attachment", this.root)
		align_orientation.Attachment0.Name = "AlignOrientationAttachment"
		align_orientation.Mode = Enum.OrientationAlignmentMode.OneAttachment
		align_orientation.RigidityEnabled = true
		align_orientation.MaxTorque = math.huge
		align_orientation.PrimaryAxis = new Vector3(0, 0, -1)
		align_orientation.Responsiveness = 3
	}

	private readonly wait_duration = 5
	private readonly tween_duration = 10

	onStart() {
		// Start at the target position immediately to avoid initial delay
		this.align_target.WorldCFrame = this.target_cframe.mul(CFrame.Angles(0, math.rad(90), 0))
		
		// Wait a frame for constraints to initialize, then unanchor
		
		
		while (true) {
			const tween_to_initial = TweenService.Create(
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
			tween_to_initial.Play()
			tween_to_initial.Completed.Wait()
			task.wait(this.wait_duration)

			const tween_to_target = TweenService.Create(
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
			tween_to_target.Play()
			tween_to_target.Completed.Wait()
			task.wait(this.wait_duration)
		}
	}
}
