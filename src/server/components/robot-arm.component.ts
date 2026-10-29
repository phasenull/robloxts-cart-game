import type { Trove } from "@rbxts/trove"
import { Logger } from "shared/common/logger"
import { rigOnce, TaggedComponent } from "shared/component"
import { Tasks } from "shared/tasks"
import { ICart } from "shared/type.helper"

const ANIMATION_NAME = "RobotArmAnimation"

/** Tag "RobotArmComponent": picks a cart up and puts it down with an animation (markers "grab" / "release"). */
export class RobotArmComponent extends TaggedComponent<IRobotArm> {
	private readonly logger = new Logger("robotarm.component")
	private readonly animation_id = "rbxassetid://82817842179637"
	private status: "waiting" | "moving" | "returning" = "waiting"
	private grabbed_cart: ICart | undefined = undefined
	// animation event key: "status" -> values "grab" | "release"
	private readonly track: AnimationTrack
	private readonly tasks = new Tasks(this.trove)

	constructor(instance: IRobotArm, trove: Trove) {
		super(instance, trove)
		rigOnce(this.instance, "robotarm", () => {
			const animation = new Instance("Animation")
			animation.Name = ANIMATION_NAME
			animation.AnimationId = this.animation_id
			animation.Parent = this.instance
		})
		const animator = this.instance.AnimationController.Animator
		const animation = this.instance.FindFirstChild(ANIMATION_NAME) as Animation
		this.track = this.trove.add(animator.LoadAnimation(animation))
		this.track.Looped = false
		// A swap mid-carry: let go of the cart (carts are rebuilt by the next generation anyway).
		this.trove.add(() => this.instance.FindFirstChild("CartWeld")?.Destroy())

		this.trove.connect(this.track.GetMarkerReachedSignal("status"), (value) => {
			switch (value) {
				case "grab":
					this.weldCart()
					break
				case "release":
					this.releaseCart()
					break
			}
		})
	}

	pickAndPlace(cart: ICart): boolean {
		if (this.status !== "waiting") {
			return false
		}
		this.grabbed_cart = cart
		this.status = "moving"
		this.track.Play()
		this.tasks.spawn(() => {
			// Wait until track.Length is populated, then delay to just before the end
			this.tasks.delay(this.track.Length - 0.1, () => {
				// Freeze on the last frame — replicates correctly since the track is still "playing"
				this.track.TimePosition = this.track.Length - 0.1
				this.track.AdjustSpeed(0)
				this.status = "waiting"
				this.logger.log("RobotArmComponent: frozen at last frame, status=waiting")
			})
		})
		return true
	}
	weldCart() {
		if (!this.grabbed_cart) {
			return
		}
		const weld = new Instance("Weld")
		weld.Name = "CartWeld"
		weld.Part0 = this.instance.GrabRoot
		weld.Part1 = this.grabbed_cart.Root
		weld.C1 = new CFrame(0, 0, 0)
		weld.Parent = this.instance
	}
	releaseCart() {
		if (!this.grabbed_cart) {
			return
		}
		this.instance.FindFirstChild("CartWeld")?.Destroy()
		this.grabbed_cart = undefined
		this.status = "returning"
	}
}

type IRobotArm = Model & {
	AnimationController: AnimationController & {
		Animator: Animator
	}
	GrabRoot: BasePart
}
