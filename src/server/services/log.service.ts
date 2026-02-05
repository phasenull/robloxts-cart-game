import { Components } from "@flamework/components"
import { Dependency, OnStart, Service } from "@flamework/core"
import { PhysicsService, Players } from "@rbxts/services"
import { LogComponent } from "server/components/log.component"
import { assets } from "shared/assets"
import { Logger } from "shared/logger"
import { ServerEvents } from "shared/network.helper"
import { MovementDirection } from "shared/type.helper"

@Service()
export class LogService implements OnStart {
	constructor(private logger: Logger) {}

	onStart(): void {
		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Connect((char) => {
				char.GetDescendants().forEach((descendant) => {
					if (descendant.IsA("BasePart")) {
						descendant.CollisionGroup = "Players"
					}
				})
			})
		})
		ServerEvents.LogService.setMovementDirection.connect(
			(player, direction, hint) => {
				if (!player.Character) return
				const log_component = this.getPlayerLog(player, hint)
				if (!log_component) return
				const side = log_component.getActorSideFromCharacter(player.Character)
				if (!side) return
				log_component.setMovementDirection(side, direction)
			}
		)
		PhysicsService.RegisterCollisionGroup("Logs")
		PhysicsService.RegisterCollisionGroup("Players")
		PhysicsService.CollisionGroupSetCollidable("Logs", "Players", false)
		PhysicsService.CollisionGroupSetCollidable("Logs", "Logs", false)
	}
	public createLog(left_char: Model, right_char: Model) {
		const components = Dependency<Components>()
		const log = assets.FindFirstChild("log_base")?.Clone()
		assert(log, "Log base asset not found")
		const log_component = components.addComponent<LogComponent>(
			log,
			LogComponent
		)
		log_component.addActor("left_char", left_char)
		log_component.addActor("right_char", right_char)
		return log_component
	}
	public getPlayerLog(player: Player, hint?: Model) {
		const char = player.Character
		if (!char) return undefined
		const components = Dependency<Components>()
		if (hint) {
			const log_component = components.getComponent<LogComponent>(hint)
			if (log_component) {
				const resolved = log_component.isCharacterInPlay(char)
				if (resolved) {
					return log_component
				}
			}
		}
		const all_logs = components.getAllComponents<LogComponent>()
		for (const log_component of all_logs) {
			const resolved = log_component.isCharacterInPlay(char)
			if (resolved) {
				return log_component
			}
		}
	}
}
