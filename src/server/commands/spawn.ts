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
            }
		]
	})
	@Guard(adminGuard)
	kick(ctx: CommandContext, player: Player, cart_skin?: string) {
        cart_skin = cart_skin ?? "Cart"
		const cart_service = Dependency<CartService>()
        const player_cframe = player.Character?.GetPivot()
        if (!player_cframe) {
            ctx.error(`Could not get character for player ${player.Name}`)
            return
        }
        
        cart_service.spawnPlayerCartAtLocation(player, player_cframe, cart_skin)
	}
}
