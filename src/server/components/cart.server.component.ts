import { Players } from "@rbxts/services"
import type { Trove } from "@rbxts/trove"
import { Dependency } from "@typetorch/framework"
import type { CartService } from "server/services/cart.service"
import { RigCartModel } from "shared/cart.helper"
import { buildCartRaycastParams, isSafeRestPose } from "shared/cart.physics"
import { CART_TUNING, CartStats, getServerSpeedLimit, resolveCartStats } from "shared/cart.tuning"
import { Logger } from "shared/common/logger"
import { TaggedComponent } from "shared/component"
import { ICart } from "shared/type.helper"

function flat(v: Vector3): Vector3 {
	return new Vector3(v.X, 0, v.Z)
}

/**
 * Server side of a cart: rigs the model, hands physics ownership to the rider and keeps that
 * ownership honest. The rider's client simulates the cart, so the server only samples the
 * replicated result: sustained overspeed or teleport-sized jumps get corrected, and the last
 * safe rest pose is recorded so revives never trust a client-sent position.
 *
 * Tag "CartComponent", guard t.instanceOf("Model").
 */
export class CartServerComponent extends TaggedComponent<ICart> {
	private readonly logger = new Logger("cartserver.component")
	private __is_cleaning_up = false
	private rider: Player | undefined
	readonly spawnedAt = os.clock()
	private readonly stats: CartStats
	private readonly speed_limit: number
	private raycast_params = buildCartRaycastParams([])
	private next_sample = 0
	private last_sample_at = 0
	private last_pivot: CFrame | undefined
	private overspeed_since: number | undefined
	private correcting = false

	constructor(instance: ICart, trove: Trove) {
		super(instance, trove)
		RigCartModel(this.instance, "simulated")
		this.stats = resolveCartStats(this.instance.Name.split("_")[0])
		this.speed_limit = getServerSpeedLimit(this.stats)
		this.trove.add(
			this.instance.Destroying.Once(() => {
				this.cleanup()
			})
		)
	}

	cleanup(): void {
		if (this.__is_cleaning_up) {
			return
		}
		this.__is_cleaning_up = true
		this.setOwnership()
		this.logger.log(`Cleaning up cart: ${this.instance.GetFullName()}`)
		// destroying the model ends the component (observeElement cleans its trove)
		this.instance.Destroy()
	}

	onStart(): void {
		const seat = this.instance.VehicleSeat
		this.trove.connect(seat.GetPropertyChangedSignal("Occupant"), () => {
			const player = Players.GetPlayerFromCharacter(seat.Occupant?.Parent)
			if (!player) {
				this.cleanup()
				return
			}
			const seat_weld = seat.FindFirstChildOfClass("Weld")
			if (seat_weld) {
				seat_weld.C0 = CART_TUNING.seat.weldC0
				seat_weld.C1 = new CFrame()
			}
			const char = player.Character
			char?.GetDescendants().forEach((descendant) => {
				if (descendant.IsA("BasePart")) {
					descendant.Massless = true
				}
			})
			this.rider = player
			this.raycast_params = buildCartRaycastParams([this.instance, char].filterUndefined())
			this.setOwnership(player)
		})
	}

	onTick(): void {
		const now = os.clock()
		if (now < this.next_sample || this.__is_cleaning_up) return
		this.next_sample = now + CART_TUNING.server.sampleInterval
		const rider = this.rider
		const root = this.instance.FindFirstChild("Root") as BasePart | undefined
		if (!rider || !root) return

		const elapsed = this.last_sample_at > 0 ? now - this.last_sample_at : 0
		const pivot = this.instance.GetPivot()
		if (!this.correcting && !this.isCarried(root, rider)) {
			if (this.last_pivot && elapsed > 0) {
				const moved = flat(pivot.Position.sub(this.last_pivot.Position)).Magnitude
				if (moved > this.speed_limit * elapsed + CART_TUNING.server.teleportMargin) {
					this.correct(root, `moved ${math.floor(moved)} studs in ${string.format("%.2f", elapsed)}s`, this.last_pivot)
					return
				}
			}
			const speed = flat(root.AssemblyLinearVelocity).Magnitude
			if (speed > this.speed_limit) {
				this.overspeed_since ??= now
				if (now - this.overspeed_since >= CART_TUNING.server.overspeedGrace) {
					this.correct(root, `sustained ${math.floor(speed)} studs/s (limit ${math.floor(this.speed_limit)})`)
					return
				}
			} else {
				this.overspeed_since = undefined
			}
		}
		if (isSafeRestPose(root, this.raycast_params)) {
			Dependency<CartService>().recordSafePivot(rider, pivot)
		}
		this.last_pivot = pivot
		this.last_sample_at = now
	}

	/** Welded to something outside the cart and its rider (robot arm, anchored carrier). */
	private isCarried(root: BasePart, rider: Player): boolean {
		const assembly_root = root.AssemblyRootPart
		if (!assembly_root) return false
		if (assembly_root.Anchored) return true
		const char = rider.Character
		return !assembly_root.IsDescendantOf(this.instance) && !(char && assembly_root.IsDescendantOf(char))
	}

	/** Takes ownership back for a moment, fixes the cart's state, then returns it to the rider. */
	private correct(root: BasePart, reason: string, restore_to?: CFrame) {
		const rider = this.rider
		this.correcting = true
		this.logger.warn(`Correcting cart of ${rider?.Name}: ${reason}`)
		this.setOwnership()
		if (restore_to) {
			this.instance.PivotTo(restore_to)
			root.AssemblyLinearVelocity = Vector3.zero
			root.AssemblyAngularVelocity = Vector3.zero
		} else {
			const v = root.AssemblyLinearVelocity
			const horizontal = flat(v)
			const clamped = horizontal.Magnitude > 0 ? horizontal.Unit.mul(this.stats.topSpeed) : Vector3.zero
			root.AssemblyLinearVelocity = new Vector3(clamped.X, v.Y, clamped.Z)
		}
		this.trove.add(task.delay(CART_TUNING.server.ownershipPenalty, () => {
				if (this.__is_cleaning_up || !this.instance.Parent) return
				if (rider && this.rider === rider) this.setOwnership(rider)
				this.overspeed_since = undefined
				this.last_pivot = this.instance.GetPivot()
				this.last_sample_at = os.clock()
				this.correcting = false
			})
		)
	}

	resolvePlayer(): Player | undefined {
		return this.rider
	}

	getStats(): CartStats {
		return this.stats
	}

	setOwnership(owner?: Player): void {
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart") && descendant.CanSetNetworkOwnership()[0]) {
				descendant.SetNetworkOwner(owner)
			}
		})
	}
}
