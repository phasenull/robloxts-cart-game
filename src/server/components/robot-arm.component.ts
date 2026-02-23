import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Logger } from "shared/logger";
import { ICart } from "shared/type.helper";

@Component({
	tag: "RobotArmComponent",
})
export class RobotArmComponent extends BaseComponent<{}, IRobotArm> {
	private readonly animation_id = "rbxassetid://82817842179637";
	private status: "waiting" | "moving" | "returning" = "waiting";
	private grabbed_cart: ICart | undefined = undefined;
	// animation event key: "status" -> values "grab" | "release"
	private readonly track: AnimationTrack;
	constructor(private logger: Logger) {
		super();
		const animator = this.instance.AnimationController.Animator;
		const animation = new Instance("Animation");
		animation.AnimationId = this.animation_id;
		animation.Parent = this.instance;
		this.track = animator.LoadAnimation(animation);
		this.track.Looped = false;
        this.track.GetMarkerReachedSignal("status").Connect((value) => {
            switch (value) {
                case "grab":
                    this.weldCart();
                    break;
                case "release":
                    this.releaseCart();
                    break;
            }
        })
		this.track.Ended.Connect(() => {
			// Freeze at last frame and mark ready for the next cart
			this.track.AdjustSpeed(0);
			this.track.TimePosition = this.track.Length;
			this.status = "waiting";
			logger.log("RobotArmComponent: cycle complete, holding at last frame, status=waiting");
		})
		// Play at speed 0 immediately to hold the arm at frame 0 (idle pose)
		this.track.Play();
		this.track.AdjustSpeed(0);
		this.track.TimePosition = 0;
		logger.log("RobotArmComponent initialized, holding at frame 0");
	}
	pickAndPlace(cart: ICart) {
		if (this.status !== "waiting") {
			return;
		}
		this.grabbed_cart = cart;
		this.status = "moving";
		this.track.AdjustSpeed(1);
	}
	weldCart() {
		if (!this.grabbed_cart) {
			return;
		}
		const weld = new Instance("Weld");
        weld.Name = "CartWeld";
		weld.Part0 = this.instance.GrabRoot;
		weld.Part1 = this.grabbed_cart.Root;
		weld.Parent = this.instance;
	}
	releaseCart() {
		if (!this.grabbed_cart) {
			return;
		}
        this.instance.FindFirstChild("CartWeld")?.Destroy()
		this.grabbed_cart = undefined;
		this.status = "returning";
	}
}

type IRobotArm = Model & {
	AnimationController: AnimationController & {
		Animator: Animator;
	};
	GrabRoot: BasePart;
};
