import { BaseComponent, Component } from "@flamework/components";
import { Dependency, OnPhysics } from "@flamework/core";
import { Players, Workspace } from "@rbxts/services";
import Signal from "@rbxts/signal";
import { PartyService } from "server/services/party.service";
import { Logger } from "shared/logger";
import { ServerEvents } from "shared/network.helper";
import { log_base, MovementDirection } from "shared/type.helper";
type ActorSide = "left_char" | "right_char";
@Component({
	tag: "LogComponent",
})
export class LogComponent
	extends BaseComponent<{}, log_base>
	implements OnPhysics
{
	private readonly y_rotation_per_second = 30;
	private state: "pre_init" | "active" | "ended" = "pre_init";
	private active_actors: ActorSide[] = [];
	private left_char: Model | undefined;
	private right_char: Model | undefined;
	private readonly actor_states = {
		left_char: 0,
		right_char: 0,
	};
	constructor(private logger: Logger) {
		super();
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.CollisionGroup = "Logs";
			}
		});
	}
	setMovementDirection(side: ActorSide, direction: MovementDirection) {
		if (direction > 0) {
			this.actor_states[side] = 1;
			this.logger.log(`Setting ${side} to: 1`);
		} else if (direction < 0) {
			this.actor_states[side] = -1;
			this.logger.log(`Setting ${side} to: -1`);
		} else {
			this.actor_states[side] = 0;
			this.logger.log(`Setting ${side} to: 0`);
		}
	}
	getActorSideFromCharacter(char: Model): ActorSide | undefined {
		if (char === this.left_char) {
			return "left_char";
		} else if (char === this.right_char) {
			return "right_char";
		}
		return undefined;
	}
	onPhysics(dt: number, time: number): void {
		const model = this.instance;
		if (!model) return;
		if (!model.Hitbox) return;
		// const right_mv = this.actor_states.right_char;
		// const left_mv = this.actor_states.left_char;
		// const right_att = model.Hitbox.right_char;
		// const left_att = model.Hitbox.left_char;
		// const motor_right = model.ball_right.CylindricalConstraint;
		// const motor_left = model.ball_left.CylindricalConstraint;
		const target_speed = 5;
		const target_direction = new Vector3(
			0,
			0,
			0// this.actor_states.left_char === this.actor_states.right_char ? this.actor_states.right_char : 0,
		);
		const target_rotation = CFrame.Angles(
			0,
			(this.y_rotation_per_second *
				(-this.actor_states.left_char + this.actor_states.right_char) *
				dt *
				math.pi) /
				180,
			0,
		);
		this.instance.PivotTo(
			this.instance
				.GetPivot()
				.mul(target_rotation)
				// .mul(new CFrame(target_direction.mul(target_speed).mul(dt)))
		);
		// const way_to_rotate = this.y_rotation_per_second * (this.actor_states.left_char + this.actor_states.right_char)
		// model.Hitbox.Orientation = model.Hitbox.Orientation.add(new Vector3(0, way_to_rotate * dt, 0))
	}
	private setState(new_state: "pre_init" | "active" | "ended") {
		this.state = new_state;
	}
	private __init = false;
	public readonly onCleanup = new Signal<
		(active_players: { side: ActorSide; player: Player }[]) => void
	>();
	start() {
		if (this.__init) return;
		this.__init = true;
		this.logger.log("LogComponent initialized and ready.");
		this.instance.Destroying.Connect(() => {
			this.logger.log("LogComponent instance is being destroyed, cleaning up.");
			this.cleanup();
		});
		this.state = "active";
	}
	getCharacters(): [Model | undefined, Model | undefined] {
		return [this.left_char, this.right_char];
	}
	getInstance() {
		return this.instance;
	}
	isCharacterInPlay(char: Model): boolean {
		return char === this.left_char || char === this.right_char;
	}
	resolveCharacterFromActor(side: ActorSide): Model | undefined {
		return side === "left_char" ? this.left_char : this.right_char;
	}
	addActor(side: ActorSide, char: Model) {
		if (!char) return;
		const player = Players.GetPlayerFromCharacter(char) as Player;
		if (!player) {
			return;
		}
		ServerEvents.LogService.setTargetAttachment.fire(
			player,
			this.instance.Hitbox.FindFirstChild(side) as Attachment,
		);

		char.Parent = Workspace;
		if (side === "left_char") {
			this.left_char = char;
		} else {
			this.right_char = char;
		}
		if (!this.active_actors.includes(side)) {
			this.active_actors.push(side);
		}
		if (this.active_actors.size() === 2) {
			this.state = "active";
			this.logger.log("Both actors added, log component is now active.");
		}
		const model = this.instance;
		const seat_name = side === "left_char" ? "LeftSeat" : "RightSeat";
		const seat = model.Align.FindFirstChild(seat_name) as Seat;
		if (!seat) {
			this.logger.error(
				`Seat ${seat_name} not found in log model ${model.GetFullName()}.`,
			);
			return;
		}
		// const weld = new Instance("Weld");
		// weld.Name = `${side}_Weld`;
		// weld.Part0 = model.Hitbox;
		// weld.Part1 = char.PrimaryPart;
		// const attachment = model.Hitbox.FindFirstChild(side) as Attachment;
		// weld.C1 = attachment.CFrame.mul(new CFrame(0, -1, 0));
		// weld.Parent = char.PrimaryPart;
		char.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.SetNetworkOwner(undefined);
				descendant.Massless = true;
			}
		});

		const humanoid = char.FindFirstChild("Humanoid") as Humanoid;
		if (!humanoid) {
			this.logger.error(
				`Humanoid for character ${char.GetFullName()} not found.`,
			);
			return;
		}
		seat.Sit(humanoid);
		humanoid.JumpHeight = 0;
		humanoid.Died.Once(() => {
			this.logger.log(
				`Humanoid for character ${char.GetFullName()} is being destroyed, removing actor.`,
			);
			this.eliminateActor(char);
		});
		char.Destroying.Once(() => {
			this.logger.log(
				`Character ${char.GetFullName()} is being destroyed, removing actor.`,
			);
			this.destroyActor(char);
		});
		// target_ball.SetNetworkOwner(player)
	}
	destroyActor(char: Model) {
		const side = this.resolveActorFromCharacter(char);
		if (!side) return;
		this.active_actors = this.active_actors.filter((s) => s !== side);
		ServerEvents.LogService.setTargetAttachment.fire(
			Players.GetPlayerFromCharacter(char) as Player,
			undefined,
		);
		const humanoid = char.FindFirstChild("Humanoid") as Humanoid;
		if (humanoid) {
			humanoid.Sit = false;
			humanoid.JumpHeight = 7.2;
		}
		if (side === "left_char") {
			this.left_char = undefined;
		} else {
			this.right_char = undefined;
		}
		if (this.active_actors.size() === 0 && this.state !== "ended") {
			this.logger.log("Both actors destroyed, ending log component.");
			this.cleanup();
		}
	}
	eliminateActor(char: Model) {
		const player = Players.GetPlayerFromCharacter(char) as Player;
		if (!player) return;
		const party_service = Dependency<PartyService>();
		const party = party_service.findParty(player);
		if (!party) return;
		party_service.boradcastToParty(
			party,
			`${player.Name} has been eliminated.`,
		);
		this.destroyActor(char);
	}
	resolveActorFromCharacter(char: Model) {
		if (char === this.left_char) {
			return "left_char";
		} else if (char === this.right_char) {
			return "right_char";
		}
		return undefined;
	}
	isSideActive(side: ActorSide): boolean {
		return this.active_actors.includes(side);
	}
	cleanup() {
		if (this.state === "ended") return;
		this.state = "ended";
		if (this.left_char) {
			this.destroyActor(this.left_char);
		}
		if (this.right_char) {
			this.destroyActor(this.right_char);
		}
		const party_service = Dependency<PartyService>();
		const left_player = this.left_char
			? Players.GetPlayerFromCharacter(this.left_char)
			: undefined;
		const right_player = this.right_char
			? Players.GetPlayerFromCharacter(this.right_char)
			: undefined;
		const winners_table: { side: ActorSide; player: Player }[] = [];
		if (left_player) {
			winners_table.push({ side: "left_char", player: left_player });
		}
		if (right_player) {
			winners_table.push({ side: "right_char", player: right_player });
		}
		this.logger.log(`this.instance: ${this.instance?.GetFullName()}`);
		this.instance?.Destroy();
		this.onCleanup.Fire(winners_table);
	}
}
