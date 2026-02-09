import { Component, Components } from "@flamework/components"
import { InteractableComponent } from "./interactable.component"
import { Logger } from "shared/logger"
import { CartTriggerComponent } from "./cart-trigger.component"
import { t } from "@rbxts/t"
import { Dependency, OnStart } from "@flamework/core"
import { CartClientComponent } from "./cart.client.component"
import { Players } from "@rbxts/services"

@Component({ tag: "CheckpointComponent" })
export class CheckpointComponent
	extends CartTriggerComponent<
		{},
		Model & {
			CheckpointContainer: Model & {
				Confetti: Attachment & {
					ParticleEmitter: ParticleEmitter
				}
			}
			Animate: Model & {
				AnimationController: AnimationController & {
					Animator: Animator
				}
			}
			Trigger: BasePart
		}
	>
	implements OnStart
{
	constructor() {
		super(new Logger("CheckpointComponent"))
		this.original_color = this.instance.Trigger.FindFirstAncestorOfClass("Beam")?.Color.Keypoints[0].Value || new Color3(1,1,1)
		const idle_animation = new Instance("Animation")
		idle_animation.AnimationId = "rbxassetid://96210827042722"
		const toggle_animation = new Instance("Animation")
		toggle_animation.AnimationId = "rbxassetid://94868340504345"
		this.idle_animation_track =
			this.instance.Animate.AnimationController.Animator.LoadAnimation(
				idle_animation
			)
		this.toggle_animation_track =
			this.instance.Animate.AnimationController.Animator.LoadAnimation(
				toggle_animation
			)
		// this.idle_animation_track.Play()
		this.is_collected = false

	}
	private idle_animation_track: AnimationTrack
	private toggle_animation_track: AnimationTrack
	private original_color: Color3
	onStart(): void {
		this.logger = new Logger(`CheckpointComponent::${this.instance.Name}`)
	}
	private is_collected = false
	onTouch(touch_part: BasePart): void {
		if (this.is_collected) return
		const model = touch_part.FindFirstAncestorOfClass("Model")
		if (!model) return

		const dependency = Dependency<Components>()
		const cart_component = dependency.getComponent(model, CartClientComponent)
		if (!cart_component) return
		const cart_owner = cart_component.resolvePlayer()
		if (!cart_owner) return
		const local_player = Players.LocalPlayer
		if (cart_owner !== local_player) return
		this.collect()
	}
	public collect() {
		if (this.is_collected) return
		this.is_collected = true
		this.logger.log(`Checkpoint reached at ${this.instance.GetFullName()}`)
		this.setColor(new Color3(0.15, 1, 0))
		this.toggle_animation_track.Play()
		this.toggle_animation_track.Priority = Enum.AnimationPriority.Action4
		this.idle_animation_track.AdjustSpeed(0)
		this.idle_animation_track.Looped = true
		this.idle_animation_track.Play()
	}
	public cleanup() {
		this.is_collected = false
		this.setColor(this.original_color)
		this.idle_animation_track.Stop()
		this.toggle_animation_track.Stop()
	}
}
