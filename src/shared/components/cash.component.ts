import { Players, RunService } from "@rbxts/services"
import type { Trove } from "@rbxts/trove"
import { Dependency, TypeTorch } from "@typetorch/framework"
import type { ComponentsService } from "server/services/components.service"
import type { DataService } from "server/services/data.service"
import { assets } from "shared/common/assets"
import { CashPopupSignal } from "shared/common/cash-popup.signal"
import { __IS_CLIENT__ } from "shared/common/config.builder"
import { BuildDeepWeldConstraints, BuildWeldConstraints } from "shared/common/util.helper"
import { network } from "shared/net"
import { Scopes, Tasks } from "shared/tasks"
import { CartTouch } from "./cart-touch.component"

const DEBOUNCE_DURATION = 300
const CASH_AMOUNT = 50

/** Tag "CashComponent": a cash pickup. The server grants it (once per player per 5 minutes); the client animates it. */
export class CashComponent extends CartTouch<
	Model & {
		Trigger: BasePart
	}
> {
	private client_collected = false
	private readonly effects = new Scopes(this.trove)
	private readonly tasks = new Tasks(this.trove)

	constructor(instance: Model & { Trigger: BasePart }, trove: Trove) {
		super(instance, trove)
		this.touch_part.Anchored = true

		if (!__IS_CLIENT__) {
			return
		}
		this.trove.add(
			network.client.CashService.cashCollected.on((position) => {
				if (this.touch_part.Position.sub(position).Magnitude > 1) return
				this.onClientTouch()
			})
		)
		const cloned = this.trove.add(assets.CashVisuals.Clone())
		cloned.PivotTo(this.instance.GetPivot())
		cloned.Parent = this.instance
		cloned.Name = "Visuals"
		const visuals = cloned
		for (const d of visuals.GetDescendants()) {
			if (!d.IsA("BasePart")) continue
			d.Massless = true
			d.CanCollide = false
		}
		const root =
			visuals.PrimaryPart ??
			visuals.FindFirstChildWhichIsA("BasePart") ??
			visuals.FindFirstChildWhichIsA("MeshPart")
		assert(root, "Visuals must have a BasePart or MeshPart as a root")
		BuildDeepWeldConstraints(root, visuals)
		// Weld the Visuals root to the Trigger so moving Trigger moves everything
		BuildWeldConstraints(this.touch_part, root)
		this.touch_part.Transparency = 1
	}

	override onTouch(other_part: BasePart, cart_model: Model): void {
		if (RunService.IsServer()) {
			this.onServerTouch(other_part, cart_model)
		}
	}

	private onServerTouch(_other_part: BasePart, cart_model: Model): void {
		const cart_component = Dependency<ComponentsService>().getCart(cart_model)
		if (!cart_component) {
			return
		}
		const player = cart_component.resolvePlayer()
		if (!player) {
			return
		}
		// Per player and pickup, kept across swaps so a deploy doesn't reset the cooldown.
		const debounce = TypeTorch.playerState<Map<string, number>>("cash.debounce.v1", () => new Map())
		const key = this.instance.GetFullName()
		const now = tick()
		const last = debounce.get(player).get(key) ?? -DEBOUNCE_DURATION
		const remaining = DEBOUNCE_DURATION - (now - last)
		if (remaining > 0) {
			return
		}
		debounce.get(player).set(key, now)
		Dependency<DataService>().grantPlayerCash(player, CASH_AMOUNT, "Cash Pickup", undefined, true)
		network.server.CashService.cashCollected.fire(player, this.touch_part.Position)
	}

	private onClientTouch(): void {
		if (this.client_collected) return
		this.client_collected = true

		const primary_part = Players.LocalPlayer.Character?.PrimaryPart
		if (!primary_part) return

		const effect = this.effects.create()
		const clone = effect.add(this.instance.Clone())
		clone.RemoveTag("CashComponent")
		clone.Parent = this.instance.Parent

		const start_pos = this.touch_part.Position

		// Hide original visuals by making parts fully transparent
		const visuals = this.instance.FindFirstChild("Visuals") as Model | undefined
		const visual_parts = (visuals?.GetDescendants().filter((d) => d.IsA("BasePart")) ?? []) as BasePart[]
		for (const part of visual_parts) part.Transparency = 1
		const particle_emitters = (visuals?.GetDescendants().filter((d) => d.IsA("ParticleEmitter")) ??
			[]) as ParticleEmitter[]
		for (const emitter of particle_emitters) emitter.Enabled = false

		// Get clone parts for fade
		const clone_visuals = clone.FindFirstChild("Visuals") as Model | undefined
		const clone_parts = (clone_visuals?.GetDescendants().filter((d) => d.IsA("BasePart")) ?? []) as BasePart[]
		const original_transparencies = clone_parts.map((p) => p.Transparency)

		const DURATION = 0.5
		const start = tick()

		effect.connect(RunService.Heartbeat, () => {
			const alpha = math.min((tick() - start) / DURATION, 1)
			const end_pos = primary_part.Position
			clone.PivotTo(new CFrame(start_pos.Lerp(end_pos, alpha)))
			// Fade out clone parts
			for (let i = 0; i < clone_parts.size(); i++) {
				clone_parts[i].Transparency = math.lerp(original_transparencies[i], 1, alpha)
			}
			if (alpha >= 1) {
				// destroys the clone and disconnects this
				this.effects.close(effect)
			}
		})
		CashPopupSignal.Fire(this.touch_part.Position)
		this.tasks.delay(DEBOUNCE_DURATION, () => {
			this.client_collected = false
			const current_visuals = this.instance.FindFirstChild("Visuals") as Model | undefined
			if (!current_visuals) return
			for (const d of current_visuals.GetDescendants()) {
				if (d.IsA("BasePart")) d.Transparency = 0
				if (d.IsA("ParticleEmitter")) d.Enabled = true
			}
		})
	}
}

export { CashPopupSignal } from "shared/common/cash-popup.signal"
