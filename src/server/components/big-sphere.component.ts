import { rigOnce, TaggedComponent } from "shared/component"

/**
 * Tag "BigSphereComponent" (BasePart): a wrecking ball on a rope, pushed by a constant force. The rope and forces are
 * world setup, handed over between generations (rigOnce), so a swap never stops the ball.
 */
export class BigSphereComponent extends TaggedComponent<BasePart> {
	onStart(): void {
		rigOnce(this.instance, "bigsphere", () => {
			this.instance.Anchored = false
			this.instance.CollisionGroup = "BigSphere"
			this.setupRope()
			this.applyRandomVelocity()
		})
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
		// Under the sphere (an anchored child isn't joined to it), so it goes when the sphere does, with no connection
		// a generation would have to own.
		anchorPart.Parent = this.instance

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
		this.instance.CustomPhysicalProperties = new PhysicalProperties(100, 0, 0, 100, 0)
		bodyAngularVelocity.Parent = this.instance
	}
}
