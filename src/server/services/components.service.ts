import { Module, Service, t, type OnStart, type OnTick } from "@typetorch/framework"
import { BigSphereComponent } from "server/components/big-sphere.component"
import { BoxingGlovesComponent } from "server/components/boxing-gloves.component"
import { BridgeComponent } from "server/components/bridge.component"
import { CartServerComponent } from "server/components/cart.server.component"
import { DamageComponent } from "server/components/damage.component"
import { RobotArmComponent } from "server/components/robot-arm.component"
import { ComponentRegistry, guardOf, type TaggedComponent } from "shared/component"
import { CartTouch } from "shared/components/cart-touch.component"
import { CashComponent } from "shared/components/cash.component"
import { ElevatorPlatformComponent } from "shared/components/elevator-platform.component"
import { PlatformComponent } from "shared/components/platform.component"

/**
 * The server's tagged components (what Flamework components did): one registry per generation, each tag observed in
 * this module's trove, each instance's behaviour in its own trove. Guards are the ones Flamework used: the explicit
 * instanceGuard where a component had one, else the guard generated from its instance type.
 */
@Service()
export class ComponentsService extends Module implements OnStart, OnTick {
	private readonly registry = new ComponentRegistry()

	onStart() {
		const registry = this.registry
		// server components
		registry.register(this.trove, "CartComponent", CartServerComponent, t.instanceOf("Model"))
		registry.register(this.trove, "DamageComponent", DamageComponent, guardOf<BasePart>())
		registry.register(this.trove, "BoxingGlovesComponent", BoxingGlovesComponent, guardOf<Model>())
		registry.register(this.trove, "BigSphereComponent", BigSphereComponent, guardOf<BasePart>())
		registry.register(this.trove, "BridgeComponent", BridgeComponent, guardOf<BridgeComponent["instance"]>())
		registry.register(this.trove, "RobotArmComponent", RobotArmComponent, guardOf<RobotArmComponent["instance"]>())
		// shared components (also built by the client's ComponentsController)
		registry.register(this.trove, "CartTouchComponent", CartTouch, guardOf<BasePart>())
		registry.register(this.trove, "CashComponent", CashComponent, guardOf<CashComponent["instance"]>())
		// Flamework's guard here was t.instanceOf("BasePart"), a ClassName no instance has: it never attached. Kept as is.
		registry.register(this.trove, "PlatformComponent", PlatformComponent, t.instanceOf("BasePart"))
		registry.register(this.trove, "ElevatorPlatformComponent", ElevatorPlatformComponent, t.instanceIsA("BasePart"))
	}

	onTick(dt: number) {
		this.registry.tick(dt)
	}

	get<C extends TaggedComponent>(instance: Instance, component: abstract new (...args: never[]) => C): C | undefined {
		return this.registry.get(instance, component)
	}

	all<C extends TaggedComponent>(component: abstract new (...args: never[]) => C): C[] {
		return this.registry.all(component)
	}

	/** The server component of a cart model (for shared code, which can't import the server class as a value). */
	getCart(cart: Instance): CartServerComponent | undefined {
		return this.registry.get(cart, CartServerComponent)
	}

	getRobotArm(model: Instance): RobotArmComponent | undefined {
		return this.registry.get(model, RobotArmComponent)
	}
}
