import { Dependency, OnStart, Service } from "@flamework/core"
import { AnalyticsService, Players, Workspace } from "@rbxts/services"
import { ServerEvents, ServerFunctions } from "shared/network.helper"
import { CartService } from "./cart.service"
import { DataService } from "./data.service"
import { Logger } from "shared/logger"
import {
	getCheckpointDataFromIndex,
	getCheckpointModelByIndex,
	getPreviousBigCheckpoint
} from "shared/cart.helper"
import { sphere } from "@rbxts/better-gizmos"

@Service({ loadOrder: 5 })
export class CheckpointService implements OnStart {
	private checkpoint_states = new Map<number, number>()
	constructor(private logger: Logger) {}
	private checkpoints = Workspace.FindFirstChild("Checkpoints")
		?.GetChildren()
		.filter((child) => child.IsA("Model")) as Model[]
	onStart(): void {
		Players.PlayerAdded.Connect((player) => {
			this.setCheckpointIndex(player, 0)
			player.CharacterAdded.Connect(() => {
				this.processPlayerDeath(player)
			})
		})
		ServerFunctions.CheckpointService.tpMeToBigCheckpoint.setCallback(
			(player) => {
				const result = this.spawnPlayerAtTheirBigCheckpoint(player)
				ServerEvents.CartService.forceCloseDeathScreen.fire(player)
				this.logger.log(`CHOSEN_SPAWN: ${result?.GetFullName()}`)
				return [true]
			}
		)
		ServerFunctions.CheckpointService.getCheckpointState.setCallback(
			(player) => {
				const checkpoint_index = this.getCheckpointIndex(player)
				const collected_checkpoints = this.getPlayerCheckpoints(player)

				return [
					{
						current_checkpoint: checkpoint_index,
						collected_checkpoints: collected_checkpoints
					}
				]
			}
		)
		ServerFunctions.CheckpointService.tpMeToCheckpoint.setCallback(
			(player, checkpoint_index) => {
				const cart_service = Dependency<CartService>()
				const player_cart = cart_service.getPlayerCartComponent(player)
				player_cart?.cleanup()
				cart_service.destroyExistingCardsIfAny(player)
				cart_service.destroyPlayerCart(player)
				if (typeOf(checkpoint_index) !== "number") {
					return [false, "Invalid checkpoint index"]
				}
				if (0 > checkpoint_index) {
					return [false, "Checkpoint index cannot be negative"]
				}
				if (checkpoint_index > (this.checkpoints?.size() || 0)) {
					return [false, "Checkpoint index out of bounds"]
				}
				this.setCheckpointIndex(player, checkpoint_index)
				this.spawnPlayerAtTheirCheckpoint(player)
				task.delay(0.1, () => {
					ServerEvents.CartService.forceCloseDeathScreen.fire(player)
					player.LoadCharacterAsync()
				})
				return [true]
			}
		)
		ServerEvents.CheckpointService.setCheckpoint.connect((player, index) => {
			if (typeOf(index) !== "number") {
				return
			}
			if (0 > index) {
				return
			}
			if (index > (this.checkpoints?.size() || 0)) {
				return
			}
			this.setCheckpointIndex(player, index)
		})
		ServerEvents.CheckpointService.processPlayerDeath.connect((player) => {
			this.processPlayerDeath(player)
		})
	}
	setCheckpointIndex(player: Player, index: number) {
		this.checkpoint_states.set(player.UserId, index)
		ServerEvents.CheckpointService.updateCheckpointState.fire(
			player,
			index,
			this.getPlayerCheckpoints(player)
		)
		this.attemptToSaveCheckpoint(player, index)
	}
	getCheckpointIndex(player: Player): number {
		return this.checkpoint_states.get(player.UserId) || 0
	}
	spawnPlayerAtTheirBigCheckpoint(player: Player) {
		const cart_service = Dependency<CartService>()
		const player_cart = cart_service.getPlayerCartComponent(player)
		if (player_cart) {
			player_cart.cleanup()
		}
		const player_checkpoint = this.getCheckpointIndex(player)
		const big_checkpoint_index = getPreviousBigCheckpoint(player_checkpoint)
		const checkpoint = getCheckpointModelByIndex(big_checkpoint_index)
		assert(
			checkpoint,
			`Checkpoint ${big_checkpoint_index} not found for player ${player.Name}`
		)
		const multi_spawn = checkpoint
			.GetChildren()
			.filter((child) => child.IsA("BasePart") && child.Name === "Spawn")
		let cframe
		const char = player.Character
		const humanoid = char?.FindFirstChildWhichIsA("Humanoid")
		if (humanoid) {
			humanoid.Sit = false
		}
		if (multi_spawn.size() > 0) {
			const random_spawn = multi_spawn[
				math.random(1, multi_spawn.size()) - 1
			] as BasePart
			cframe = random_spawn.CFrame
			char?.PivotTo(cframe)
			return random_spawn
		}
	}
	spawnPlayerAtTheirCheckpoint(player: Player) {
		const checkpoint_index = this.getCheckpointIndex(player)
		const checkpoint = this.checkpoints?.find(
			(checkpoint) => checkpoint.Name === tostring(checkpoint_index)
		)
		assert(
			checkpoint,
			`Checkpoint ${checkpoint_index} not found for player ${player.Name}`
		)
		let char = player.Character
		assert(
			char,
			`Character not found for player ${player.Name} when spawning to checkpoint`
		)
		let cframe: CFrame | undefined

		// BIG CHECKPOINT
		const multi_spawn = checkpoint
			.GetChildren()
			.filter((child) => child.IsA("BasePart") && child.Name === "Spawn")
		if (multi_spawn.size() > 0) {
			const random_spawn = multi_spawn[
				math.random(1, multi_spawn.size()) - 1
			] as BasePart
			cframe = random_spawn.CFrame
			char.PivotTo(cframe)
			return
		}
		// SMALL CHECKPOINT
		cframe = (checkpoint.FindFirstChild("Trigger") as BasePart)?.CFrame
		char.PivotTo(cframe)
		const cart_service = Dependency<CartService>()
		cart_service.spawnPlayerCartAtLocation(player, cframe)
	}
	getPlayerCheckpoints(player: Player): number[] {
		const profile_service = Dependency<DataService>()
		const profile = profile_service.getProfile(player)
		if (!profile) {
			this.logger.warn(
				`Profile not found for player ${player.Name} when getting checkpoints`
			)
			return []
		}
		return profile.Data.collected_checkpoints
	}
	attemptToSaveCheckpoint(player: Player, checkpoint_index: number) {
		const profile_service = Dependency<DataService>()
		const profile = profile_service.getProfile(player)
		if (checkpoint_index >= 0) {
			AnalyticsService.LogOnboardingFunnelStepEvent(
				player,
				checkpoint_index,
				getCheckpointDataFromIndex(checkpoint_index)?.name ||
					`unknown_checkpoint-${checkpoint_index}`
			)
		}
		
		if (!this.isBigCheckpoint(checkpoint_index)) {
			return
		}
		if (!profile) {
			return
		}
		const collected_checkpoints = profile.Data.collected_checkpoints
		if (!collected_checkpoints.includes(checkpoint_index)) {
			collected_checkpoints.push(checkpoint_index)
			profile.Save()
		}
	}
	isBigCheckpoint(checkpoint_index: number) {
		const model = this.checkpoints.find(
			(e) => e.Name === tostring(checkpoint_index)
		) as Model
		if (!model) {
			this.logger.warn(`Checkpoint model ${checkpoint_index} not found`)
			return false
		}
		return !!model.FindFirstChild("Spawn")
	}
	processPlayerDeath(player: Player) {
		return this.spawnPlayerAtTheirCheckpoint(player)
	}
}
