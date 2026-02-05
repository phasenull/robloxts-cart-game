import { Components } from "@flamework/components"
import { Dependency, OnStart, Service } from "@flamework/core"
import { Component } from "@rbxts/react"
import { HttpService, Workspace } from "@rbxts/services"
import { LogComponent } from "server/components/log.component"
import { assets } from "shared/assets"
import { Logger } from "shared/logger"
import { ServerEvents, ServerFunctions } from "shared/network.helper"
import { Party, ProperReturns } from "shared/type.helper"

@Service()
export class PartyService implements OnStart {
	private readonly max_players = 2
	constructor(private logger: Logger) {}
	onStart(): void {
		ServerFunctions.PartyService.createParty.setCallback((player) => {
			return this.createParty(player,true)
		})
		ServerFunctions.PartyService.leaveParty.setCallback((player) => {
			return this.leaveParty(player)
		})
		ServerFunctions.PartyService.joinParty.setCallback((player, party_id) => {
			return this.joinParty(player, party_id)
		})
		ServerFunctions.PartyService.getPartyState.setCallback((player) => {
			const party = this.findParty(player)
			if (!party) {
				return [undefined]
			}
			return [party]
		})
		ServerFunctions.PartyService.getAvailableParties.setCallback(() => {
			return [this.getPublicParties()]
		})
		ServerFunctions.PartyService.changeVisibility.setCallback((player, is_public) => {
			return this.configurePartyVisibility(player, is_public)
		})
		ServerFunctions.PartyService.startPartyMatchmaking.setCallback((player) => {
			const party = this.findParty(player)
			if (!party) {
				return [false, "You are not in a party."]
			}
			if (party.owner !== player) {
				return [false, "Only the party owner can start matchmaking."]
			}
			if (party.state !== "lobby") {
				return [false, "Party is already in a game."]
			}
			party.state = "playing"
			const players = party.players
			this.logger.log(
				`Starting matchmaking for party ${party.guid} with players: ${players
					.map((p) => p.Name)
					.join(", ")}`
			)
			const components = Dependency<Components>()
			const base_log = assets.log_base.Clone()
			base_log.Parent = Workspace
			base_log.Name = `PartyMatchmakingLog_${party.guid}`
			const base_log_comp = components.addComponent<LogComponent>(base_log)
			assert(base_log_comp, "LogComponent not found on log_base")
			const left = players?.[0]
			const right = players?.[1]
			const left_char = left?.Character
			const right_char = right?.Character
			task.wait(0.1) // Wait a moment to ensure characters are loaded
			if (left_char) {
				base_log_comp.addActor("left_char",left_char)
			}
			if (right && right_char) {
				base_log_comp.addActor("right_char", right_char)
			}
			base_log_comp.start()
			base_log_comp.onCleanup.Once(() => {
				this.logger.log(
					`Matchmaking log for party ${party.guid} has been cleaned up.`
				)
				party.state = "lobby"
			})

			return [true]
		})
	}
	private readonly parties: Array<Party> = []
	public destroyParty(guid: string) {
		const party_index = this.parties.findIndex((p) => p.guid === guid)
		if (party_index === -1) return
		this.parties.remove(party_index)
	}
	public leaveParty(player: Player): ProperReturns<true> {
		const party = this.findParty(player)
		if (!party) return [false, "You are not in a party."]
		party.players = party.players.filter((p) => p !== player)
		ServerEvents.PartyService.partyUpdated.fire(
			player,
			undefined,
			`You have left the party.`
		)
		ServerFunctions.PartyService.leaveParty.setCallback((player) => {
			return this.leaveParty(player)
		})
		this.boradcastToParty(party, `${player.Name} has left the party.`)
		if (party.owner === player) {
			if (party.players.size() > 0) {
				this.setPartyOwner(party, party.players[0])
			} else {
				this.destroyParty(party.guid)
			}
		}
		return [true]
	}
	public boradcastToParty(party: Party, message: string): void {
		for (const player of party.players) {
			ServerEvents.PartyService.partyUpdated.fire(player, party, message)
		}
	}
	public setPartyOwner(party: Party, new_owner: Player) {
		if (!party.players.includes(new_owner)) return
		party.owner = new_owner
		this.boradcastToParty(party, `${new_owner.Name} is now the party owner.`)
	}
	public findParty(player: Player) {
		return this.parties.find((p) => p.players.includes(player))
	}
	public inviteToParty(player: Player, target: Player): ProperReturns<true> {
		const [authorized_party, err] = this.getAuthorizedParty(player)
		if (!authorized_party) {
			return [false, err]
		}

		if (authorized_party.invites.includes(target)) {
			return [false, "Player is already invited."]
		}
		authorized_party.invites.push(target)
		// TODO: Fire event to target player
		return [true]
	}
	public getAuthorizedParty(player: Player): ProperReturns<Party> {
		const party = this.findParty(player)
		if (!party) {
			return [false, "You are not in a party."]
		}
		if (party.owner !== player) {
			return [false, "Only the party owner can change visibility."]
		}
		return [party]
	}
	public configurePartyVisibility(
		player: Player,
		is_public: boolean
	): ProperReturns<true> {
		const [party, err] = this.getAuthorizedParty(player)
		if (!party) {
			return [false, err]
		}
		party.is_public = is_public
		this.boradcastToParty(
			party,
			`The party is now ${is_public ? "public" : "private"}.`
		)
		return [true]
	}
	public getPublicParties(): Array<Party> {
		return this.parties.filter((p) => p.is_public)
	}
	public createParty(
		player: Player,
		is_public: boolean = false
	): ProperReturns<Party> {
		const existing_party = this.findParty(player)
		if (existing_party) {
			return [false, "You are already in a party."]
		}
		const new_party: Party = {
			players: [player],
			owner: player,
			guid: HttpService.GenerateGUID(false),
			invites: [],
			is_public: is_public,
			max_players: this.max_players,
			state: "lobby",
		}
		this.parties.push(new_party)
		ServerEvents.PartyService.partyUpdated.fire(
			player,
			new_party,
			`You have created a new party.`
		)
		return [new_party]
	}
	public joinParty(player: Player, guid: string): ProperReturns<Party> {
		const party = this.parties.find((p) => p.guid === guid)
		if (!party) {
			return [false, "Party not found."]
		}
		if (party.players.includes(player)) {
			return [false, "You are already in this party."]
		}
		if (!party.is_public && !party.invites.includes(player)) {
			return [false, "You are not invited to this party."]
		}
		if (party.players.size() >= party.max_players) {
			return [false, "The party is full."]
		}
		if (party.state !== "lobby") {
			return [false, "The party is already in a game."]
		}
		party.players.push(player)
		this.boradcastToParty(party, `${player.Name} has joined the party.`)
		return [party]
	}
}
