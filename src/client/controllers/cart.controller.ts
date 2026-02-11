import { Components } from "@flamework/components"
import { Controller, Dependency, OnStart } from "@flamework/core"
import { arrow, point, sphere } from "@rbxts/better-gizmos"
import { MarketplaceService, Players, Workspace } from "@rbxts/services"
import Signal from "@rbxts/signal"
import { CartClientComponent } from "client/components/cart.client.component"
import { UIHelper } from "client/ui.helper"
import { Logger } from "shared/logger"
import { ClientEvents, ClientFunctions } from "shared/network.helper"
import { PRODUCTS } from "shared/purchasables"
import { ProperReturns } from "shared/type.helper"

@Controller({ loadOrder: 5 })
export class CartController implements OnStart {
	constructor(private logger: Logger) {}
	private __last_checkpoint: CFrame | undefined
	saveCheckpoint(cframe: CFrame) {
		this.__last_checkpoint = cframe
		const drawn = sphere.draw(cframe.Position, 1)
		task.delay(0.05, () => {
			if (this.__last_checkpoint === cframe) {
				return
			}
			drawn.Destroy()
		})
	}
	public onCartChange = new Signal<
		(cart: CartClientComponent | undefined) => void
	>()
	public toggleOnDeathScreen = new Signal<
		(spawn_point: CFrame | undefined) => void
	>()
	toggleDeathScreen(enabled: boolean) {
		if (enabled && this.__last_checkpoint) {
			this.toggleOnDeathScreen.Fire(this.__last_checkpoint)
		} else {
			this.toggleOnDeathScreen.Fire(undefined)
		}
	}
	private __is_reviving = false
	private __pending_purchase = false
	private __cached_stage = 0
	
	tryStartPurchaseFlow(): boolean {
		if (this.__pending_purchase) {
			return false
		}
		this.__pending_purchase = true
		return true
	}
	
	finishPurchaseFlow(): void {
		this.__pending_purchase = false
	}
	
	async promptRevive(current_stage: number): Promise<ProperReturns<true>> {
		if (!this.__last_checkpoint) {
			return [false, "No checkpoint to revive to"]
		}
		if (this.__is_reviving) {
			return [false, "Already reviving"]
		}
		this.__is_reviving = true

		const cache = this.__last_checkpoint
		this.__cached_stage = current_stage || 0

		this.__is_reviving = true
		// this.logger.log("Reviving player...")
		if (!cache) {
			return [false, "No checkpoint to revive to"]
		}
		const local_player = Players.LocalPlayer
		const [success, err] =
			await ClientFunctions.CartService.revive.invokeWithTimeout(
				5000,
				cache,
				this.__cached_stage
			)
		this.__is_reviving = false
		if (!success) {
			this.logger.warn(`Failed to revive-spawn cart: ${err}`)
			return [success, err]
		}
		// this.__last_checkpoint = undefined
		// UIHelper.toggleFade(false)
		return [true]
	}
	getMyCart(): CartClientComponent | undefined {
		const components = Dependency<Components>()
		const carts = components.getAllComponents(CartClientComponent)
		const my_cart = carts.find((cart) => {
			return cart.resolvePlayer() === Players.LocalPlayer
		})
		return my_cart
	}
	onStart(): void {
		const components = Dependency<Components>()
		
		// Listen for boxing glove punches
		ClientEvents.CartService.boxingGlovePunch.connect((touch_position: Vector3) => {
			const cart = this.getMyCart()
			if (!cart) return
			
			const cart_instance = cart.instance
			const root = cart_instance.FindFirstChild("Root") as BasePart | undefined
			if (!root) return
			
			// Calculate punch direction from touch position to cart
			const punch_direction = root.Position.sub(touch_position).Unit
			
			// Apply linear velocity (punch force)
			const punch_force = 150
			const current_velocity = root.AssemblyLinearVelocity
			const new_velocity = current_velocity.add(punch_direction.mul(punch_force))
			root.AssemblyLinearVelocity = new_velocity
			
			// Apply angular velocity (spinning effect)
			const spin_torque = new Vector3(
				math.random() * 2 - 1,
				math.random() * 4 - 2,
				math.random() * 2 - 1
			).mul(5)
			const current_angular = root.AssemblyAngularVelocity
			root.AssemblyAngularVelocity = current_angular.add(spin_torque)
		})
	}
}
