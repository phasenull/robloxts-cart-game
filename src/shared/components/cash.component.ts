import { CollectionService, HttpService, Players, RunService, Workspace } from "@rbxts/services"
import { Trove } from "@rbxts/trove"
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
/** How far (studs, beyond both parts' half sizes) a reported touch may be from the pickup on the server. */
const MAX_TOUCH_GAP = 40
/** Attribute with the pickup's id: every pickup in the place has the same full name (Workspace.Cash.Cash). */
const PICKUP_ID_ATTRIBUTE = "CashPickupId"

/** Per player and pickup id: when it was last collected. Kept across swaps so a deploy doesn't reset the cooldown. */
function collectedAt() {
	return TypeTorch.playerState<Map<string, number>>("cash.debounce.v2", () => new Map())
}

/** Records a collection of `id` at `now` and returns true, unless it was collected less than DEBOUNCE_DURATION ago. */
export function claimPickup(collected: Map<string, number>, id: string, now: number): boolean {
	const last = collected.get(id)
	if (last !== undefined && now - last < DEBOUNCE_DURATION) return false
	collected.set(id, now)
	return true
}

/**
 * Tag "CashComponent": a cash pickup. The server grants it (once per player and pickup per 5 minutes) to the rider of
 * a cart or a character on foot that touches it; the client animates it.
 */
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
			// on the instance, so it outlives generations (the debounce state keyed by it does too)
			if (!typeIs(this.instance.GetAttribute(PICKUP_ID_ATTRIBUTE), "string")) {
				this.instance.SetAttribute(PICKUP_ID_ATTRIBUTE, HttpService.GenerateGUID(false))
			}
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

	pickupId(): string | undefined {
		const id = this.instance.GetAttribute(PICKUP_ID_ATTRIBUTE)
		return typeIs(id, "string") ? id : undefined
	}

	override onTouch(other_part: BasePart, cart_model: Model): void {
		if (!RunService.IsServer()) return
		const player = Dependency<ComponentsService>().getCart(cart_model)?.resolvePlayer()
		if (player) this.onServerTouch(other_part, player)
	}

	override onCharacterTouch(other_part: BasePart, character: Model, player: Player): void {
		if (!RunService.IsServer()) return
		const humanoid = character.FindFirstChildOfClass("Humanoid")
		if (!humanoid || humanoid.Health <= 0) return
		this.onServerTouch(other_part, player)
	}

	private onServerTouch(other_part: BasePart, player: Player): void {
		// the touch comes from the owner's client: it must be near the pickup in the server's view too
		const gap = other_part.Position.sub(this.touch_part.Position).Magnitude
		const reach = (other_part.Size.Magnitude + this.touch_part.Size.Magnitude) / 2 + MAX_TOUCH_GAP
		if (gap > reach) return
		const id = this.pickupId()
		if (id === undefined) return
		const data = Dependency<DataService>()
		if (!data.getProfile(player)) return // not loaded yet: don't use up the pickup
		if (!claimPickup(collectedAt().get(player), id, tick())) return
		data.grantPlayerCash(player, CASH_AMOUNT, "Cash Pickup", undefined, true)
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

/**
 * The cloud test's check of the pickups (`workspace:GetAttribute("TypeTorchTest")`, no players there): every placed
 * pickup is bound with its own id, the cooldown is per pickup, and a touch reaches the cart / character handler.
 */
export function selfTestCashPickups(components: CashComponent[]) {
	const placed = CollectionService.GetTagged("CashComponent").filter((i) => i.IsDescendantOf(Workspace))
	assert(components.size() === placed.size(), `cash: ${components.size()} of ${placed.size()} pickups bound`)
	const ids = new Set<string>()
	for (const component of components) {
		const id = component.pickupId()
		assert(id !== undefined, `cash: ${component.instance.GetFullName()} has no id`)
		assert(!ids.has(id), `cash: id ${id} is used twice`)
		ids.add(id)
	}

	const collected = new Map<string, number>()
	assert(claimPickup(collected, "a", 1000), "cash: first pickup refused")
	assert(claimPickup(collected, "b", 1001), "cash: a second pickup refused after the first")
	assert(!claimPickup(collected, "a", 1002), "cash: the same pickup granted twice")
	assert(claimPickup(collected, "a", 1000 + DEBOUNCE_DURATION), "cash: pickup refused after the cooldown")

	const trove = new Trove()
	const touched: string[] = []
	class Probe extends CartTouch {
		override onTouch(_part: BasePart, cart: Model) {
			touched.push(`cart ${cart.Name}`)
		}
		override onCharacterTouch(_part: BasePart, character: Model) {
			touched.push(`character ${character.Name}`)
		}
	}
	const probe = new Probe(trove.add(new Instance("Part")), trove)
	const cart = trove.add(new Instance("Model"))
	cart.Name = "Probe Cart_probe"
	cart.AddTag("CartComponent")
	const wheels = new Instance("Model", cart)
	const ball = new Instance("Part", wheels)
	const stranger = trove.add(new Instance("Model"))
	const stray = new Instance("Part", stranger)
	probe.handleTouch(ball)
	probe.handleTouch(stray)
	trove.destroy()
	assert(touched.size() === 1 && touched[0] === "cart Probe Cart_probe", `cash: touch routing ${touched.join(", ")}`)
	print(`cash self-test: ${components.size()} pickups bound with unique ids, cooldown and touch routing ok`)
}
