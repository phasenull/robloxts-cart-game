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
		root.CollisionGroup = "Default"
		this.root = root
		this.root.PivotTo(this.instance.Animate.GetPivot())
		
		// Make all other parts massless and weld them to root
		// This ensures root is the physics assembly root
		this.instance.Animate.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart") && descendant !== this.root) {
				descendant.Anchored = false
				descendant.Massless = true // Make massless so root is the physics root
				descendant.CollisionGroup = "Default" // Use default collision
				// Set physical properties to prevent bouncing
				descendant.CustomPhysicalProperties = new PhysicalProperties(
					0.7, // Density
					0.5, // Friction (some friction to keep cart on platform)
					0, // Elasticity (no bounce)
					1, // FrictionWeight
					1 // ElasticityWeight
				)
				BuildWeldConstraints(this.root, descendant)
			}
		})
		
		this.instance.Animate.PrimaryPart = this.root

		// Setup AlignPosition
		this.align_position = new Instance("AlignPosition", this.root)
		this.align_position.Attachment0 = new Instance("Attachment", this.root)
		this.align_position.Attachment0.Name = "AlignPositionAttachment"
		this.align_position.Attachment0.CFrame = new CFrame(0, 0, 0)
		// Parent to a BasePart so the constraint solver can resolve it
		this.align_target = new Instance(
			"Attachment",
			Workspace.FindFirstChild("runtime") as BasePart
		)
		this.align_target.Name = "ElevatorAlignTarget"
		this.align_target.WorldCFrame = this.initial_cframe
		this.align_position.Attachment1 = this.align_target
		this.align_position.MaxForce = math.huge
		this.align_position.Responsiveness = 20 // Higher for very smooth movement
		this.align_position.MaxVelocity = 15 // Reduced to prevent physics issues
		this.align_position.RigidityEnabled = true
		this.align_position.Enabled = true

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
		
		// Wait a frame for constraints to initialize
		task.wait()
		
		// Double-check all parts are unanchored
		this.instance.Animate.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart") && descendant !== this.root) {
				descendant.Anchored = false
			}
		})
		
		this.root.Anchored = false
		this.logger.log(`Elevator unanchored, root mass: ${this.root.Mass}`)
		
		task.wait(this.wait_duration)
		
		while (true) {
			const tween_to_initial = TweenService.Create(
				this.align_target,
				new TweenInfo(
					this.tween_duration,
					Enum.EasingStyle.Sine, // Smoother than Quad for moving platforms
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
					Enum.EasingStyle.Sine, // Smoother than Quad for moving platforms
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
