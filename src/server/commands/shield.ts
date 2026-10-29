import { Dependency } from "@typetorch/framework"
import {
	CenturionType,
	Command,
	CommandContext,
	CommandGuard,
	Guard,
	Register
} from "@rbxts/centurion"
import { adminGuard } from "server/common/auth-guard"
import type { CartService } from "server/services/cart.service"

@Register()
class CommandClass {
	@Command({
		name: "shield",
		description: "Give a player a shield",
		arguments: [
			{
				name: "player",
				description: "Player to give shield to",
				type: CenturionType.Player
			},
			
			{
				name: "duration",
				description: "Duration of the shield in seconds",
				type: CenturionType.Number,
				optional: true,
				suggestions: ["5", "10", "15", "20", "30"]
			}
		]
	})
	@Guard(adminGuard)
	kick(ctx: CommandContext, player: Player, duration = 10) {
		const cart_service = Dependency<CartService>()
		const player_CART = cart_service.getPlayerCart(player)
		if (!player_CART) {
			ctx.error(`${player.Name} is not in a cart`)
			return
		}
		cart_service.addShield(player_CART, duration)
		ctx.reply(`Granted ${duration} second shield to ${player.Name}`)
	}
}
