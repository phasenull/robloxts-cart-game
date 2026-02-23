import { BaseComponent, Component } from "@flamework/components"
import { Dependency, OnStart } from "@flamework/core"
import { Players, RunService, Workspace } from "@rbxts/services"
import { t } from "@rbxts/t"
import type { CartService } from "server/services/cart.service"
import { ClientEvents, ServerEvents } from "shared/network.helper"

// Maximum allowed distance (studs) between cart root and platform centre for server validation
const MAX_VALIDATION_DISTANCE = 40

@Component({
	tag: "PlatformComponent",
	instanceGuard: t.instanceOf("BasePart"),
})
export class PlatformComponent
	extends BaseComponent<{}, BasePart>
	implements OnStart
{
	private isOn = false
	private heartbeat: RBXScriptConnection | undefined
	private touched: RBXScriptConnection | undefined

	/** Override in subclasses — called when the cart is confirmed on this platform. */
	public onEnter(): void {}

	/** Override in subclasses — called when the cart leaves this platform. */
	public onLeave(): void {}

	onStart(): void {
		if (RunService.IsClient()) {
			this.setupClientTouch()
		}

		if (RunService.IsServer()) {
			this.setupServerListeners()
		}
	}

	destroy(): void {
		this.heartbeat?.Disconnect()
		this.touched?.Disconnect()
		super.destroy()
	}

	// ─── Client ───────────────────────────────────────────────────────────────

	private getLocalCart(): { cartModel: Model; root: BasePart } | undefined {
		const local_player = Players.LocalPlayer
		const cartsFolder = Workspace.FindFirstChild("Carts") ?? Workspace
		const cartModel = cartsFolder
			.GetChildren()
			.find(
				(c) =>
					c.IsA("Model") &&
					c.Name.sub(-local_player.Name.size() - 1) === `_${local_player.Name}`,
			) as Model | undefined
		if (!cartModel) return undefined
		const root = cartModel.FindFirstChild("Root") as BasePart | undefined
		if (!root) return undefined
		return { cartModel, root }
	}

	private setupClientTouch(): void {
		this.touched = this.instance.Touched.Connect((hit) => {
			const local_player = Players.LocalPlayer
			const suffix = `_${local_player.Name}`

			// Walk up through all ancestor models to find the cart (hit may be inside a wheel sub-model)
			let ancestor: Instance | undefined = hit.Parent
			let cart: Model | undefined
			while (ancestor) {
				if (ancestor.IsA("Model") && ancestor.Name.sub(-suffix.size()) === suffix) {
					cart = ancestor
					break
				}
				ancestor = ancestor.Parent
			}
			if (!cart) return

			// Already tracking — ignore duplicate touches
			if (this.heartbeat) return

			// Start heartbeat loop to keep checking while on platform
			this.heartbeat = RunService.Heartbeat.Connect(() => {
				const result = this.getLocalCart()
				if (!result) {
					this.clientSetOn(false)
					this.heartbeat?.Disconnect()
					this.heartbeat = undefined
					return
				}
				const touching = this.instance.GetTouchingParts()
				const stillOn = touching.some((p) => p.IsDescendantOf(result.cartModel))
				if (!stillOn) {
					this.clientSetOn(false)
					this.heartbeat?.Disconnect()
					this.heartbeat = undefined
					return
				}
				this.clientSetOn(true)
			})
		})
	}

	private clientSetOn(value: boolean): void {
		if (value === this.isOn) return
		this.isOn = value
		print(`[PlatformComponent] clientSetOn -> ${value} on ${this.instance.Name}`)
		if (value) {
			ClientEvents.PlatformService.onEnter.fire(this.instance)
		} else {
			ClientEvents.PlatformService.onLeave.fire(this.instance)
		}
	}

	// ─── Server ───────────────────────────────────────────────────────────────

	protected setupServerListeners(): void {
		print(`[PlatformComponent] setupServerListeners registered on ${this.instance.Name}`)
		ServerEvents.PlatformService.onEnter.connect((player, platform) => {
			if (platform !== this.instance) return
			print(`[PlatformComponent] server onEnter received from ${player.Name} for ${this.instance.Name}`)
			if (!this.validatePlayerNearPlatform(player)) {
				print(`[PlatformComponent] validatePlayerNearPlatform FAILED for ${player.Name}`)
				return
			}
			this.onEnter()
		})

		ServerEvents.PlatformService.onLeave.connect((player, platform) => {
			if (platform !== this.instance) return
			print(`[PlatformComponent] server onLeave received from ${player.Name} for ${this.instance.Name}`)
			this.onLeave()
		})
	}

	private validatePlayerNearPlatform(player: Player): boolean {
		const cartService = Dependency<CartService>()
		const cart = cartService.getPlayerCart(player)
		if (!cart) return false

		const root = cart.FindFirstChild("Root") as BasePart | undefined
		if (!root) return false

		const distance = root.Position.sub(this.instance.Position).Magnitude
		return distance <= MAX_VALIDATION_DISTANCE
	}

}
