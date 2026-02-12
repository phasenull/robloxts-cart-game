import { Players } from "@rbxts/services"

export const GROUP_ID = 1059580522
export function isTester(player:Player) {
	const rank = player.GetRankInGroupAsync(GROUP_ID)
	return rank >= 5
}

export function getRole(player:Player) {
	return player.GetRoleInGroupAsync(GROUP_ID)
}