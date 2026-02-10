import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";

@Component({
    tag: "BigSphereComponent"
})
export class BigSphereComponent extends BaseComponent<{},BasePart & {AttachedTo:Attachment}> implements OnStart {
    private rope?: RopeConstraint;
    
    onStart(): void {
        this.setupRope();
        this.applyRandomVelocity();
    }
    
    private setupRope(): void {
        const attachment = this.instance.AttachedTo;
        if (!attachment) {
            warn("BigSphereComponent: AttachedTo attachment not found");
            return;
        }
        
        // Create attachment on the sphere for the rope
        const sphereAttachment = new Instance("Attachment");
        sphereAttachment.Name = "SphereAttachment";
        sphereAttachment.Parent = this.instance;
        
        // Create rope constraint
        const rope = new Instance("RopeConstraint");
        rope.Attachment0 = attachment;
        rope.Attachment1 = sphereAttachment;
        rope.Length = 20;
        rope.Visible = true;
        rope.Thickness = 0.2;
        rope.Color = new BrickColor("Really red");
        rope.Parent = this.instance;
        
        this.rope = rope;
    }
    
    private applyRandomVelocity(): void {
        // Create BodyVelocity for linear velocity
        const bodyVelocity = new Instance("BodyVelocity");
        bodyVelocity.MaxForce = new Vector3(4000, 4000, 4000);
        bodyVelocity.Velocity = new Vector3(
            math.random(-20, 20),
            math.random(-20, 20),
            math.random(-20, 20)
        );
        bodyVelocity.Parent = this.instance;
        
        // Create BodyAngularVelocity for rotation
        const bodyAngularVelocity = new Instance("BodyAngularVelocity");
        bodyAngularVelocity.MaxTorque = new Vector3(4000, 4000, 4000);
        bodyAngularVelocity.AngularVelocity = new Vector3(
            math.random(-10, 10),
            math.random(-10, 10),
            math.random(-10, 10)
        );
        bodyAngularVelocity.Parent = this.instance;
    }
}