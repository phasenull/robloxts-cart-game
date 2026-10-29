import {
	Players,
	RunService,
	TweenService,
	Workspace
} from "@rbxts/services"
import Signal from "@rbxts/signal"
import { Controller, Dependency, Module, type OnInit, type OnStart } from "@typetorch/framework"
import { CartClientComponent } from "client/components/cart.client.component"
import type { ComponentsController } from "client/controllers/components.controller"

import { Logger } from "shared/common/logger"
import { network } from "shared/net"
import { assets } from "shared/common/assets"
import { getNextSmallCheckpoint } from "shared/cart.helper"
import { ProperReturns } from "shared/common/util.helper";
import { Scopes, Tasks } from "shared/tasks"

/** Kept across client swaps (plain data): the revive anchor and whether the death screen is up. */
interface DeathState {
	/** CFrame components of the last safe rest pose the cart reported. */
	lastCheckpoint?: number[]
	deathScreen: boolean
}

@Controller({ loadOrder: 5 })
export class CartController extends Module implements OnInit, OnStart {
	private readonly logger = new Logger("cart.controller")
	private death!: DeathState
	private effects!: Scopes
	private tasks!: Tasks

	onInit() {
		this.death = this.ctx.persist<DeathState>("cart.death.v1", () => ({ deathScreen: false }))
		this.effects = new Scopes(this.trove)
		this.tasks = new Tasks(this.trove)
		this.trove.add(this.onCartChange)
		this.trove.add(this.toggleOnDeathScreen)
	}
	private lastCheckpoint(): CFrame | undefined {
		const components = this.death.lastCheckpoint
		if (!components) return undefined
		const [x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22] = components
		return new CFrame(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22)
	}
	saveCheckpoint(cframe: CFrame) {
		this.death.lastCheckpoint = [...cframe.GetComponents()]
	}
	public readonly onCartChange = new Signal<
		(cart: CartClientComponent | undefined) => void
	>()
	public readonly toggleOnDeathScreen = new Signal<
		(spawn_point: CFrame | undefined) => void
	>()
	toggleDeathScreen(enabled: boolean) {
		const last_checkpoint = this.lastCheckpoint()
		if (enabled && last_checkpoint) {
			this.death.deathScreen = true
			this.toggleOnDeathScreen.Fire(last_checkpoint)
		} else {
			this.death.deathScreen = false
			this.toggleOnDeathScreen.Fire(undefined)
		}
	}
	/** The death screen a swap interrupted (the UI reopens it at mount), else undefined. */
	getOpenDeathScreen(): CFrame | undefined {
		return this.death.deathScreen ? this.lastCheckpoint() : undefined
	}
	/** The UI closed the death screen (a hard reset). */
	closeDeathScreen() {
		this.death.deathScreen = false
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
		if (!this.lastCheckpoint()) {
			return [false, "No checkpoint to revive to"]
		}
		if (this.__is_reviving) {
			return [false, "Already reviving"]
		}
		this.__is_reviving = true

		const cache = this.lastCheckpoint()
		this.__cached_stage = current_stage || 0

		this.__is_reviving = true
		// this.logger.log("Reviving player...")
		if (!cache) {
			return [false, "No checkpoint to revive to"]
		}
		const [success, err] =
			await network.client.CartService.revive.invokeWithTimeout(
				5,
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
		const effect = this.effects.create()
		effect.add(arrow_model)
		arrow_model.CanCollide = false
		arrow_model.Anchored = true
		// Anchor all parts in the arrow

		// Get the checkpoint trigger position

		// Update arrow rotation continuously for 7 seconds using Heartbeat
		const start_time = tick()
		const duration = 7

		effect.connect(RunService.RenderStepped, () => {
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
				this.effects.close(effect) // disconnects this and destroys the arrow
				return
			}

			// Get cart's current position
			const cart = this.getMyCart()
			if (!cart) {
				this.effects.close(effect)
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
		const carts = Dependency<ComponentsController>().all(CartClientComponent)
		const my_cart = carts.find((cart) => {
			return cart.resolvePlayer() === Players.LocalPlayer
		})
		return my_cart
	}
	onStart(): void {
		// The death screen closes when a cart arrives or the server says so (kept for the next generation's UI).
		this.trove.add(
			this.onCartChange.Connect((cart) => {
				if (cart) this.closeDeathScreen()
			})
		)
		this.trove.add(network.client.CartService.forceCloseDeathScreen.on(() => this.closeDeathScreen()))

		// Listen for honk VFX broadcast
		this.trove.add(network.client.CartService.honkVfx.on((cartModel, soundDuration) => {
			const honkModel = cartModel.FindFirstChild("Honk") as Model | undefined
			if (!honkModel) return

			const effect = this.effects.create()
			const scaleValue = effect.add(new Instance("NumberValue"))
			scaleValue.Value = 1

			const tweenInfo = new TweenInfo(0.2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true, 0)
			const tween = TweenService.Create(scaleValue, tweenInfo, { Value: 1.5 })

			effect.connect(scaleValue.Changed, (value) => {
				honkModel.ScaleTo(value)
			})
			effect.add(() => {
				tween.Cancel()
				honkModel.ScaleTo(1)
			})

			tween.Play()
			this.tasks.delay(soundDuration, () => this.effects.close(effect))
		}))

		// Listen for boxing glove punches
		this.trove.add(network.client.CartService.boxingGlovePunch.on(
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

				// punch: +150 studs/s along the hit direction plus a random spin, as impulses
				const punch_speed = 150
				root.ApplyImpulse(punch_direction.mul(punch_speed * root.AssemblyMass))
				const spin = new Vector3(
					math.random() * 2 - 1,
					math.random() * 4 - 2,
					math.random() * 2 - 1
				).mul(5)
				root.AssemblyAngularVelocity = root.AssemblyAngularVelocity.add(spin)
			}
		))
	}
}
