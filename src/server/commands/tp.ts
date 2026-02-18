import { CenturionType, Command, CommandContext, Guard, Register } from "@rbxts/centurion";
import { adminGuard } from "server/common/auth-guard";

@Register()
class CommandClass {
	@Command({
		name: "tp",
		description: "Teleport to a player or teleport one player to another",
		arguments: [
			{
				name: "player",
				description: "Player to teleport (or target if no second player specified)",
				type: CenturionType.Player
			},
			{
				name: "target",
				description: "Target player to teleport to (optional)",
				type: CenturionType.Player,
				optional: true
			}
		]
	})
	@Guard(adminGuard)
	tp(ctx: CommandContext, player: Player, target?: Player) {
		// If target is specified, teleport player to target
		// Otherwise, teleport the executor to player
		const playerToTeleport = target !== undefined ? player : ctx.executor;
		const targetPlayer = target !== undefined ? target : player;

		// Validate executor exists
		if (!playerToTeleport || !typeIs(playerToTeleport, "Instance") || !playerToTeleport.IsA("Player")) {
			ctx.error("Could not determine player to teleport");
			return;
		}

		// Get characters
		const teleportChar = playerToTeleport.Character;
		const targetChar = targetPlayer.Character;

		if (!teleportChar) {
			ctx.error(`${playerToTeleport.Name} has no character`);
			return;
		}

		if (!targetChar) {
			ctx.error(`${targetPlayer.Name} has no character`);
			return;
		}

		// Get target position
		const targetCFrame = targetChar.GetPivot();

		// Teleport the player
		teleportChar.PivotTo(targetCFrame.mul(new CFrame(3, 0, 0))); // Offset by 3 studs on X axis

		// Send confirmation message
		if (target !== undefined) {
			ctx.reply(`Teleported ${playerToTeleport.Name} to ${targetPlayer.Name}`);
		} else {
			ctx.reply(`Teleported to ${targetPlayer.Name}`);
		}
	}
}
