import { BaseComponent, Component } from "@flamework/components"
import { OnStart } from "@flamework/core"

@Component({
	tag: "BigSphereComponent"
})
export class BigSphereComponent
	extends BaseComponent<{}, BasePart>
	implements OnStart
{
	private rope?: RopeConstraint
	private anchorPart?: BasePart

	onStart(): void {
		this.instance.Anchored = false
		this.instance.CollisionGroup = "BigSphere"
		this.setupRope()
		this.applyRandomVelocity()
	}

	private setupRope(): void {
		// Create an anchored invisible part above the sphere
		const anchorPart = new Instance("Part")
		anchorPart.Name = "RopeAnchor"
		anchorPart.Size = new Vector3(1, 1, 1)
		anchorPart.Position = this.instance.Position.add(new Vector3(0, 100, 0))
		anchorPart.Anchored = true
		anchorPart.Transparency = 1
		anchorPart.CanCollide = false
		anchorPart.Parent = this.instance.Parent

		this.anchorPart = anchorPart

		// Create attachment on the anchor part
		const anchorAttachment = new Instance("Attachment")
		anchorAttachment.Name = "AnchorAttachment"
		anchorAttachment.Parent = anchorPart

		// Create attachment on the sphere for the rope
		const sphereAttachment = new Instance("Attachment")
		sphereAttachment.Name = "SphereAttachment"
		sphereAttachment.Parent = this.instance

		// Create rope constraint
		const rope = new Instance("RopeConstraint")
		rope.Attachment0 = anchorAttachment
		rope.Attachment1 = sphereAttachment
		rope.Length = 100
		rope.Visible = true
		rope.Thickness = 1
		rope.Color = new BrickColor("Dark grey")
		rope.Parent = this.instance

		this.rope = rope
	}

	private applyRandomVelocity(): void {
		// Create attachment for the force
		const forceAttachment = new Instance("Attachment")
		forceAttachment.Name = "ForceAttachment"
		forceAttachment.Parent = this.instance

		// Create VectorForce for continuous linear force
		const vectorForce = new Instance("VectorForce")
		vectorForce.Attachment0 = forceAttachment
		vectorForce.Force = new Vector3(1000000, 0, 1000000)
		vectorForce.RelativeTo = Enum.ActuatorRelativeTo.Attachment0
		vectorForce.Parent = this.instance

		// Create BodyAngularVelocity for rotation
		const bodyAngularVelocity = new Instance("BodyAngularVelocity")
		bodyAngularVelocity.MaxTorque = new Vector3(500000, 500000, 500000)
		bodyAngularVelocity.AngularVelocity = new Vector3(
			math.random(-10, 10),
			math.random(-10, 10),
			math.random(-10, 10)
		)
        bodyAngularVelocity.P = 50000
        this.instance.CustomPhysicalProperties = new PhysicalProperties(100, 0, 0, 100,0)
		bodyAngularVelocity.Parent = this.instance
	}

	destroy(): void {
		if (this.anchorPart) {
			this.anchorPart.Destroy()
		}
	}
}
