import { Components } from "@flamework/components"
import { Controller, Dependency, OnStart } from "@flamework/core"
import { arrow, point, sphere } from "@rbxts/better-gizmos"
import {
	MarketplaceService,
	Players,
	RunService,
	TweenService,
	Workspace
} from "@rbxts/services"
import Signal from "@rbxts/signal"
import { CartClientComponent } from "client/components/cart.client.component"

import { Logger } from "@common/shared/logger"
import { ClientEvents, ClientFunctions } from "shared/network.helper"
import { PRODUCTS } from "shared/purchasables"
import { ProperReturns } from "shared/type.helper"
import { assets } from "@common/shared/assets"
import { getNextSmallCheckpoint } from "shared/cart.helper"
import { UIHelper } from "@common/client/ui.helper";

@Controller({ loadOrder: 5 })
export class CartController implements OnStart {
	constructor(private logger: Logger) {}
	private __last_checkpoint: CFrame | undefined
	saveCheckpoint(cframe: CFrame) {
		this.__last_checkpoint = cframe
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

		// Create and position arrow pointing to next small checkpoint (client-side)
		const next_checkpoint = getNextSmallCheckpoint(this.__cached_stage)
		if (!next_checkpoint) {
			return [false, "No next checkpoint found"]
		}
		const arrow_model = assets.PointArrow?.Clone() as BasePart | undefined
		if (!arrow_model) {
			return [false, "Arrow asset not found"]
		}
		arrow_model.CanCollide = false
		arrow_model.Anchored = true
		// Anchor all parts in the arrow

		// Get the checkpoint trigger position

		// Update arrow rotation continuously for 7 seconds using Heartbeat
		const start_time = tick()
		const duration = 7

		const heartbeat_connection = RunService.RenderStepped.Connect(() => {
			const checkpoint_trigger = next_checkpoint.FindFirstChild("Trigger") as
				| BasePart
				| undefined
			if (!checkpoint_trigger) {
				return [false, "Checkpoint trigger not found"]
			}
			const checkpoint_position = checkpoint_trigger.Position

			arrow_model.Parent = Workspace.CurrentCamera
			const elapsed = tick() - start_time
			if (elapsed >= duration || !arrow_model.Parent) {
				heartbeat_connection.Disconnect()
				arrow_model.Destroy()
				return
			}

			// Get cart's current position
			const cart = this.getMyCart()
			if (!cart) {
				heartbeat_connection.Disconnect()
				arrow_model.Destroy()
				return
			}

			const cart_cframe = cart.instance.GetPivot()
			const cart_position = cart_cframe.Position
			const look_at = CFrame.lookAt(cart_position, checkpoint_position)
				.mul(new CFrame(0, 0, -5))
				.mul(CFrame.Angles(math.rad(0), math.rad(0), math.rad(90)))
			arrow_model.PivotTo(look_at)
		})

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

		// Listen for honk VFX broadcast
		ClientEvents.CartService.honkVfx.connect((cartModel, soundDuration) => {
			const honkModel = cartModel.FindFirstChild("Honk") as Model | undefined
			if (!honkModel) return

			const scaleValue = new Instance("NumberValue")
			scaleValue.Value = 1

			const tweenInfo = new TweenInfo(0.2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true, 0)
			const tween = TweenService.Create(scaleValue, tweenInfo, { Value: 1.5 })

			scaleValue.Changed.Connect((value) => {
				honkModel.ScaleTo(value)
			})

			tween.Play()
			task.delay(soundDuration, () => {
				tween.Cancel()
				honkModel.ScaleTo(1)
				scaleValue.Destroy()
			})
		})

		// Listen for boxing glove punches
		ClientEvents.CartService.boxingGlovePunch.connect(
			(touch_position: Vector3) => {
				const cart = this.getMyCart()
				if (!cart) return

				const cart_instance = cart.instance
				const root = cart_instance.FindFirstChild("Root") as
					| BasePart
					| undefined
				if (!root) return

				// Calculate punch direction from touch position to cart
				const punch_direction = root.Position.sub(touch_position).Unit

				// Apply linear velocity (punch force)
				const punch_force = 150
				const current_velocity = root.AssemblyLinearVelocity
				const new_velocity = current_velocity.add(
					punch_direction.mul(punch_force)
				)
				root.AssemblyLinearVelocity = new_velocity

				// Apply angular velocity (spinning effect)
				const spin_torque = new Vector3(
					math.random() * 2 - 1,
					math.random() * 4 - 2,
					math.random() * 2 - 1
				).mul(5)
				const current_angular = root.AssemblyAngularVelocity
				root.AssemblyAngularVelocity = current_angular.add(spin_torque)
			}
		)
	}
}
