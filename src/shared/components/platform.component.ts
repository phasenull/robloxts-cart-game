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
			// Only react to a part belonging to the local player's cart
			const local_player = Players.LocalPlayer
			const suffix = `_${local_player.Name}`
			const cart = hit.FindFirstAncestorOfClass("Model")
			if (!cart || cart.Name.sub(-suffix.size()) !== suffix) return

			// Already tracking — ignore duplicate touches
			if (this.heartbeat) return

			// Start heartbeat loop to keep checking while on platform
			this.heartbeat = RunService.Heartbeat.Connect(() => {
				const result = this.getLocalCart()
				if (!result || !this.allRaysHitPlatform(result.root, result.cartModel)) {
					// Cart left the platform
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
		if (value) {
			ClientEvents.PlatformService.onEnter.fire(this.instance)
		} else {
			ClientEvents.PlatformService.onLeave.fire(this.instance)
		}
	}

	// ─── Server ───────────────────────────────────────────────────────────────

	private setupServerListeners(): void {
		ServerEvents.PlatformService.onEnter.connect((player, platform) => {
			if (platform !== this.instance) return
			if (!this.validatePlayerNearPlatform(player)) return
			this.onEnter()
		})

		ServerEvents.PlatformService.onLeave.connect((player, platform) => {
			if (platform !== this.instance) return
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

	// ─── Shared raycast logic ─────────────────────────────────────────────────

	private allRaysHitPlatform(root: BasePart, cartModel: Model): boolean {
		const size = root.Size
		const deadZone = 3
		const corners = [
			new Vector3(size.X / 2 + deadZone, 0, size.Z / 2 + deadZone),
			new Vector3(-size.X / 2 - deadZone, 0, size.Z / 2 + deadZone),
			new Vector3(size.X / 2 + deadZone, 0, -size.Z / 2 - deadZone),
			new Vector3(-size.X / 2 - deadZone, 0, -size.Z / 2 - deadZone),
		]

		const rayParams = new RaycastParams()
		rayParams.FilterDescendantsInstances = [cartModel]
		rayParams.FilterType = Enum.RaycastFilterType.Blacklist
		rayParams.IgnoreWater = true

		for (const corner of corners) {
			const ray = Workspace.Raycast(
				root.Position.add(corner),
				new Vector3(0, -1, 0).mul(9),
				rayParams,
			)
			if (!ray || ray.Instance !== this.instance) return false
		}
		return true
	}
}
