import { Dependency, OnStart, Service } from "@flamework/core"
import { Players, Workspace } from "@rbxts/services"
import { ServerEvents } from "shared/network.helper"
import { CartService } from "./cart.service"
import { DataService } from "./data.service"
import { Logger } from "shared/logger"

@Service()
export class CheckpointService implements OnStart {
	private checkpoint_states = new Map<number, number>()
	constructor(private logger: Logger) {}
	private checkpoints = Workspace.FindFirstChild("Checkpoints")
		?.GetChildren()
		.filter((child) => child.IsA("Model")) as Model[]
	onStart(): void {
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
		ServerEvents.CheckpointService.updateCheckpointState(player, index, this.getPlayerCheckpoints(player))
	}
	getCheckpointIndex(player: Player): number {
		return this.checkpoint_states.get(player.UserId) || 0
	}
	getPlayerCheckpoints(player: Player): number[] {
		const profile_service = Dependency<DataService>()
		const profile = profile_service.getProfile(player)
		if (!profile) {
			return []
		}
		return profile.Data.collected_checkpoints
	}
	attemptToSaveCheckpoint(player: Player, checkpoint_index: number) {
		const profile_service = Dependency<DataService>()
		const profile = profile_service.getProfile(player)
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
		const checkpoint_index = this.getCheckpointIndex(player)
		const checkpoint = this.checkpoints?.find(
			(checkpoint) => checkpoint.Name === tostring(checkpoint_index)
		)
		assert(
			checkpoint,
			`Checkpoint ${checkpoint_index} not found for player ${player.Name}`
		)
		let cframe: CFrame | undefined
		const multi_spawn = checkpoint
			.GetChildren()
			.filter((child) => child.IsA("BasePart") && child.Name === "Spawn")
		if (multi_spawn.size() > 0) {
			const random_spawn = multi_spawn[
				math.random(1, multi_spawn.size()) - 1
			] as BasePart
			cframe = random_spawn.CFrame
			let char = player.Character
			if (!char) {
				player.LoadCharacterAsync()
				char = player.Character
				if (!char) {
					player.CharacterAdded.Wait()
					char = player.Character
				}
			}
			if (char) {
				char.PivotTo(cframe ?? CFrame.identity)
			}
		} else {
			// warn(
			// 	`Checkpoint ${checkpoint_index} for player ${player.Name} has no valid spawn point`
			// )
		}
		if (!cframe) {
			cframe = (checkpoint.FindFirstChild("Trigger") as BasePart)?.CFrame
			const cart_service = Dependency<CartService>()
			cart_service.spawnPlayerCartAtLocation(player, cframe ?? CFrame.identity)
		}
	}
}
