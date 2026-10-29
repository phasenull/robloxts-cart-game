import { Controller, Module, t, type OnPhysics, type OnRender, type OnStart } from "@typetorch/framework"
import { AutoFlipComponent } from "client/components/auto-flip.component"
import { ButtonComponent } from "client/components/button.component"
import { CartTriggerComponent } from "client/components/cart-trigger.component"
import { CartClientComponent } from "client/components/cart.client.component"
import { CheckpointComponent, type CheckpointModel } from "client/components/checkpoint.component"
import { IslandComponent } from "client/components/island.component"
import { PurchaseComponent } from "client/components/purchase.component"
import { RgbComponent } from "client/components/rgb.component"
import { ComponentRegistry, guardOf, type TaggedComponent } from "shared/component"
import { CartTouch } from "shared/components/cart-touch.component"
import { CashComponent } from "shared/components/cash.component"
import { ElevatorPlatformComponent } from "shared/components/elevator-platform.component"
import { PlatformComponent } from "shared/components/platform.component"
import { ButtonModel } from "shared/type.helper"

type TriggerModel = Model & { Trigger: BasePart }

/**
 * The client's tagged components (what Flamework components did): one registry per generation, each tag observed in
 * this module's trove. Guards are the ones Flamework used (explicit, or generated from the instance type); a model
 * that streams in without its children yet gets its component once they arrive.
 */
@Controller()
export class ComponentsController extends Module implements OnStart, OnPhysics, OnRender {
	private readonly registry = new ComponentRegistry()

	onStart() {
		const registry = this.registry
		// client components
		registry.register(this.trove, "CartComponent", CartClientComponent, t.instanceOf("Model"))
		registry.register(this.trove, "CartTriggerComponent", CartTriggerComponent, guardOf<TriggerModel>())
		registry.register(this.trove, "AutoFlipComponent", AutoFlipComponent, guardOf<TriggerModel>())
		registry.register(this.trove, "CheckpointComponent", CheckpointComponent, guardOf<CheckpointModel>())
		registry.register(this.trove, "ButtonComponent", ButtonComponent, guardOf<ButtonModel>())
		registry.register(this.trove, "IslandComponent", IslandComponent, guardOf<Model>())
		registry.register(this.trove, "PurchaseComponent", PurchaseComponent, guardOf<Model>())
		registry.register(this.trove, "RGBComponent", RgbComponent, guardOf<Model>())
		// shared components (also built by the server's ComponentsService)
		registry.register(this.trove, "CartTouchComponent", CartTouch, guardOf<BasePart>())
		registry.register(this.trove, "CashComponent", CashComponent, guardOf<TriggerModel>())
		// Flamework's guard here was t.instanceOf("BasePart"), a ClassName no instance has: it never attached. Kept as is.
		registry.register(this.trove, "PlatformComponent", PlatformComponent, t.instanceOf("BasePart"))
		registry.register(this.trove, "ElevatorPlatformComponent", ElevatorPlatformComponent, t.instanceIsA("BasePart"))
	}

	onPhysics(dt: number) {
		this.registry.physics(dt)
	}

	onRender(dt: number) {
		this.registry.render(dt)
	}

	get<C extends TaggedComponent>(instance: Instance, component: abstract new (...args: never[]) => C): C | undefined {
		return this.registry.get(instance, component)
	}

	all<C extends TaggedComponent>(component: abstract new (...args: never[]) => C): C[] {
		return this.registry.all(component)
	}
}
