import { Dependency } from "@typetorch/framework"
import {
	CenturionType,
	Command,
	CommandContext,
	Guard,
	Register
} from "@rbxts/centurion"
import { adminGuard } from "server/common/auth-guard"
import type { CartService } from "server/services/cart.service"
import type { DataService } from "server/services/data.service"

type GiveType = "revives" | "cart" | "honk" | "cash"

@Register()
class GiveCommand {
	@Command({
		name: "give",
		description: "Give a player revives, a cart, a honk, or cash",
		arguments: [
			{
				name: "player",
				description: "Target player",
				type: CenturionType.Player,
			},
			{
				name: "type",
				description: "What to give: revives | cart | honk | cash",
				type: CenturionType.String,
			},
			{
				name: "value",
				description: "Amount (for revives/cash) or name (for cart/honk)",
				type: CenturionType.String,
			},
		],
	})
	@Guard(adminGuard)
	give(ctx: CommandContext, player: Player, give_type: string, value: string) {
		const cart_service = Dependency<CartService>()
		const data_service = Dependency<DataService>()

		switch (give_type as GiveType) {
			case "revives": {
				const amount = tonumber(value)
				if (!amount || amount <= 0) {
					ctx.error("Amount must be a positive number")
					return
				}
				cart_service.incrementPlayerRevives(player, amount)
				ctx.reply(`Gave ${player.Name} ${amount} revive(s)`)
				break
			}
			case "cash": {
				const amount = tonumber(value)
				if (!amount || amount <= 0) {
					ctx.error("Amount must be a positive number")
					return
				}
				data_service.grantPlayerCash(player, amount, "Admin give")
				ctx.reply(`Gave ${player.Name} $${amount}`)
				break
			}
			case "cart": {
				cart_service.grantPlayerPermaCart(player, value)
				ctx.reply(`Gave ${player.Name} the "${value}" cart`)
				break
			}
			case "honk": {
				const profile = data_service.getProfile(player)
				if (!profile) {
					ctx.error(`Profile not loaded for ${player.Name}`)
					return
				}
				if (!profile.Data.inventory["honk"]) {
					profile.Data.inventory["honk"] = []
				}
				if (!profile.Data.inventory["honk"].includes(value)) {
					profile.Data.inventory["honk"].push(value)
				}
				ctx.reply(`Gave ${player.Name} the "${value}" honk`)
				break
			}
			default:
				ctx.error(`Unknown type "${give_type}". Use: revives | cart | honk | cash`)
		}
	}
}
