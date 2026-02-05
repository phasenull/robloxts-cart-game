import { CenturionType, Command, CommandContext, CommandGuard, Guard, Register } from "@rbxts/centurion";
import { adminGuard } from "server/common/auth-guard";


@Register()
class CommandClass {
  @Command({
      name: "kick",
      description: "Kick a player",
      arguments: [
          {
              name: "player",
              description: "Player to kick",
              type: CenturionType.Player
          }
      ]
  })
  @Guard(adminGuard)
  kick(ctx: CommandContext, player: Player) {
      player.Kick("You have been kicked from the server.");
      ctx.reply(`Successfully kicked ${player.Name}`);
  }
}