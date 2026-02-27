import { Logger } from "@common/shared/logger";
import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { ICart } from "shared/type.helper";

@Component({
	tag: "RobotArmComponent",
})
export class RobotArmComponent
	extends BaseComponent<{}, IRobotArm>
	implements OnStart
{
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
		});
	}

	onStart(): void {}

	pickAndPlace(cart: ICart): boolean {
		if (this.status !== "waiting") {
			return false;
		}
		this.grabbed_cart = cart;
		this.status = "moving";
		this.track.Play();
		task.spawn(() => {
			// Wait until track.Length is populated, then delay to just before the end
			task.delay(this.track.Length - 0.1, () => {
				// Freeze on the last frame — replicates correctly since the track is still "playing"
				this.track.TimePosition = this.track.Length - 0.1;
				this.track.AdjustSpeed(0);
				this.status = "waiting";
				this.logger.log(
					"RobotArmComponent: frozen at last frame, status=waiting",
				);
			});
		});
		return true;
	}
	weldCart() {
		if (!this.grabbed_cart) {
			return;
		}
		const weld = new Instance("Weld");
		weld.Name = "CartWeld";
		weld.Part0 = this.instance.GrabRoot;
		weld.Part1 = this.grabbed_cart.Root;
		weld.C1 = new CFrame(0, 0, 0);
		weld.Parent = this.instance;
	}
	releaseCart() {
		if (!this.grabbed_cart) {
			return;
		}
		this.instance.FindFirstChild("CartWeld")?.Destroy();
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
