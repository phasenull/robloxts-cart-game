import { Logger } from "shared/common/logger"
import { CartTriggerComponent } from "./cart-trigger.component"
import { Dependency, TypeTorch } from "@typetorch/framework"
import { CartClientComponent } from "./cart.client.component"
import { Players } from "@rbxts/services"
import type { Trove } from "@rbxts/trove"
import { UIHelper } from "client/common/ui.helper"
import { A } from "shared/common/assets"
import { network } from "shared/net"
import { promptGroupJoin } from "client/group-prompt"
import type { ComponentsController } from "client/controllers/components.controller"
import { Tasks } from "shared/tasks"
import { homeValue } from "shared/component"

export type CheckpointModel = Model & {
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

/** The checkpoint this client last collected, kept across swaps so its looping animation carries on. */
function collectedState() {
	return TypeTorch.persist("checkpoint.collected.v1", () => ({ name: undefined as string | undefined }))
}

/** Tag "CheckpointComponent": collected by the local player's cart; tells the server and plays the effects. */
export class CheckpointComponent extends CartTriggerComponent<CheckpointModel> {
	private readonly tasks = new Tasks(this.trove)
	private original_colorpart: BasePart | undefined
	constructor(instance: CheckpointModel, trove: Trove) {
		super(instance, trove)
		this.logger = new Logger("CheckpointComponent")
		// home values: after a swap the beams and plate may still show the collected colour
		this.original_color = homeValue(
			this.instance.Trigger,
			"checkpoint_color",
			this.instance.Trigger.FindFirstChildOfClass("Beam")?.Color.Keypoints[0].Value || new Color3(1, 1, 1)
		)
		const plate = this.instance.Animate.FindFirstChild("Plate") as
			| BasePart
			| undefined
		const color_part = plate?.FindFirstChild("ColorPart") as
			| BasePart
			| undefined
		assert(
			plate,
			`Checkpoint ${this.instance.GetFullName()} model is missing Animate.Plate part`
		)
		assert(
			color_part,
			`Checkpoint ${this.instance.GetFullName()} model is missing Animate.Plate.ColorPart part`
		)

		this.original_colorpart_color = homeValue(color_part, "checkpoint_colorpart", color_part.Color)
		this.original_colorpart = color_part
		const idle_animation = new Instance("Animation")
		idle_animation.AnimationId = "rbxassetid://96210827042722"
		const toggle_animation = new Instance("Animation")
		toggle_animation.AnimationId = "rbxassetid://94868340504345"
		this.idle_animation_track = this.trove.add(
			this.instance.Animate.AnimationController.Animator.LoadAnimation(
				idle_animation
			)
		)
		this.toggle_animation_track = this.trove.add(
			this.instance.Animate.AnimationController.Animator.LoadAnimation(
				toggle_animation
			)
		)
		// this.idle_animation_track.Play()
		this.is_collected = false
		this.trove.add(network.client.CheckpointService.updateCheckpointState.on((state,all) => {
			const numbered = tonumber(this.instance.Name)
			if (numbered !== state) {
				return
			}
			this.collect()
		}))
		// Collected before a swap: same state, its idle loop playing again (no sound, effects or message)
		if (collectedState().name === this.instance.GetFullName()) {
			this.is_collected = true
			this.idle_animation_track.AdjustSpeed(0)
			this.idle_animation_track.Looped = true
			this.idle_animation_track.Play()
		}
	}
	private idle_animation_track: AnimationTrack
	private toggle_animation_track: AnimationTrack
	private original_color: Color3
	private original_colorpart_color: Color3
	onStart(): void {
		this.logger = new Logger(`CheckpointComponent::${this.instance.Name}`)
	}
	private is_collected = false
	onTouch(touch_part: BasePart): void {
		if (this.is_collected) return
		const model = touch_part.FindFirstAncestorOfClass("Model")
		if (!model) return

		const cart_component = Dependency<ComponentsController>().get(model, CartClientComponent)
		if (!cart_component) return
		const cart_owner = cart_component.resolvePlayer()
		if (!cart_owner) return
		const local_player = Players.LocalPlayer
		if (cart_owner !== local_player) return
		this.collect()
	}
	public collect() {
		if (this.is_collected) return
		const all_checkpoints = Dependency<ComponentsController>().all(CheckpointComponent)
		all_checkpoints.forEach((checkpoint) => {
			if (checkpoint === this) return
			checkpoint.cleanup()
		})
		this.is_collected = true
		collectedState().name = this.instance.GetFullName()
		this.logger.log(`Checkpoint reached at ${this.instance.GetFullName()}`)
		this.setColor(new Color3(0.15, 1, 0))
		if (this.original_colorpart) {
			this.original_colorpart.Color = new Color3(0.15, 1, 0)
		}
		this.toggle_animation_track.Play()
		this.toggle_animation_track.Priority = Enum.AnimationPriority.Action4
		this.idle_animation_track.AdjustSpeed(0)
		this.idle_animation_track.Looped = true
		this.idle_animation_track.Play()
		UIHelper.playSound(A.sounds.party)
		this.instance.CheckpointContainer.Confetti.ParticleEmitter.Enabled = true
		this.tasks.delay(2, () => {
			this.instance.CheckpointContainer.Confetti.ParticleEmitter.Enabled = false
		})
		const name = this.instance.Name
		network.client.CheckpointService.setCheckpoint.fire(tonumber(name) || 0)

		const is_big_checkpoint = !!this.instance.FindFirstChild("Spawn")
		if (is_big_checkpoint) {
			promptGroupJoin()
		}
	}
	public cleanup() {
		this.is_collected = false
		this.setColor(this.original_color)
		this.idle_animation_track.Stop()
		this.toggle_animation_track.Stop()
		this.instance.CheckpointContainer.Confetti.ParticleEmitter.Enabled = false
		if (this.original_colorpart) {
			this.original_colorpart.Color = this.original_colorpart_color
		}
	}
}
