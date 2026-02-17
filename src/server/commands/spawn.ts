import { Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import {
	CenturionType,
	Command,
	CommandContext,
	CommandGuard,
	Guard,
	Register
} from "@rbxts/centurion"
import { adminGuard } from "server/common/auth-guard"
import { CartService } from "server/services/cart.service"
import { CheckpointService } from "server/services/checkpoint.service"
import { getCheckpointModelByIndex } from "shared/cart.helper"

@Register()
class CommandClass {
	@Command({
		name: "spawn",
		description: "Spawn player with a cart",
		arguments: [
			{
				name: "player",
				description: "Player to spawn",
				type: CenturionType.Player
			},
            {
                name: "cart_skin",
                description: "Cart skin to use",
                type: "CartSkin",
                optional: true
            },
            {
                name: "checkpoint",
                description: "Checkpoint index to spawn at",
                type: CenturionType.Integer,
                optional: true
            }
		]
	})
	@Guard(adminGuard)
	kick(ctx: CommandContext, player: Player, cart_skin?: string, checkpoint?: number) {
        cart_skin = cart_skin ?? "Cart"
		const cart_service = Dependency<CartService>()

        let spawn_cframe: CFrame

        if (checkpoint !== undefined) {
            const checkpoint_model = getCheckpointModelByIndex(checkpoint)
            if (!checkpoint_model) {
                ctx.error(`Checkpoint ${checkpoint} not found`)
                return
            }
            const spawns = checkpoint_model
                .GetChildren()
                .filter((child) => child.IsA("BasePart") && child.Name === "Spawn")
            if (spawns.size() > 0) {
                const random_spawn = spawns[math.random(1, spawns.size()) - 1] as BasePart
                spawn_cframe = random_spawn.CFrame
            } else {
                const trigger = checkpoint_model.FindFirstChild("Trigger") as BasePart
                if (!trigger) {
                    ctx.error(`Checkpoint ${checkpoint} has no Spawn or Trigger part`)
                    return
                }
                spawn_cframe = trigger.CFrame
            }
            const checkpoint_service = Dependency<CheckpointService>()
            checkpoint_service.setCheckpointIndex(player, checkpoint)
        } else {
            const player_cframe = player.Character?.GetPivot()
            if (!player_cframe) {
                ctx.error(`Could not get character for player ${player.Name}`)
                return
            }
            spawn_cframe = player_cframe
        }

        const cart = cart_service.spawnPlayerCartAtLocation(player, spawn_cframe, cart_skin)
        
        // Teleport player to spawn location and seat them
        const char = player.Character
        const humanoid = char?.FindFirstChildOfClass("Humanoid")
        if (char && humanoid) {
            char.PivotTo(spawn_cframe.mul(new CFrame(0, 2, 0)))
        }
	}
}
