import { Controller, OnPhysics, OnRender, OnStart } from "@flamework/core"
import { PhysicsService, Players, UserInputService } from "@rbxts/services"
import { Logger } from "shared/logger"
import { ClientEvents } from "shared/network.helper"
import { log_base, MovementDirection } from "shared/type.helper"

@Controller()
export class LogController implements OnStart, OnRender, OnPhysics {
	constructor(private logger: Logger) {}

	onStart(): void {
		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return
			if (!this.target_attachment) return
			if (input.KeyCode === Enum.KeyCode.W) {
				this.move(1)
			} else if (input.KeyCode === Enum.KeyCode.S) {
				this.move(-1)
			}
		})
		const player = Players.LocalPlayer

		ClientEvents.LogService.setTargetAttachment.connect((attachment) => {
			this.logger.log(
				`Received request to set target attachment from server: ${attachment?.GetFullName()}`
			)
			this.setTargetAttachment(attachment)
		})
		UserInputService.InputEnded.Connect((input, gameProcessed) => {
			if (gameProcessed) return
			if (!this.target_attachment) return
			if (
				input.KeyCode === Enum.KeyCode.W ||
				input.KeyCode === Enum.KeyCode.S
			) {
				this.move(0)
			}
		})
	}
	private model: log_base | undefined
	onPhysics(dt: number, time: number): void {
		if (!this.target_attachment) return
		if (!this.model) {
			this.logger.warn("No log model associated with target attachment")
			return
		}
		return
		// const model = this.model
		// const position = model.Hitbox.Position
		// const right_att = model.Hitbox.right_char
		// const left_att = model.Hitbox.left_char
		// const rotation = CFrame.lookAt(
		// 	right_att.WorldPosition,
		// 	left_att.WorldPosition
		// )
		// const align = this.model.Align
		// const distance = right_att.WorldPosition.sub(left_att.WorldPosition).Magnitude
		// align.PivotTo(rotation.mul(CFrame.Angles(0, math.rad(90), 0)).mul(new CFrame(distance/2, 0, 0)))
	}
	onRender(dt: number): void {
		if (!this.target_attachment) return
		const position = this.target_attachment.WorldPosition
		const player = Players.LocalPlayer
		const char = player.Character
		const humanoid = char?.FindFirstChild("Humanoid") as Humanoid
		if (!humanoid) {
			return
		}
		const target_position = position.add(new Vector3(0, 2, 0))

		const log_model = this.model
		if (!log_model) return
	}
	public move(direction: MovementDirection) {
		if (!this.target_attachment) return
		const model = this.getLogModel()
		if (!model) return
		this.movement_direction = direction
		ClientEvents.LogService.setMovementDirection.fire(
			this.movement_direction,
			model
		)
	}
	private movement_direction: MovementDirection = 0
	private target_attachment: Attachment | undefined
	getLogModel(): log_base | undefined {
		if (!this.target_attachment) return undefined
		return (
			(this.target_attachment.FindFirstAncestorOfClass("Model") as log_base) ||
			undefined
		)
	}
	getAngle(): number {
		if (!this.target_attachment) return 0
		const model = this.getLogModel()
		if (!model) return 0
		model.Hitbox.CFrame.Rotation.X
		return model.Hitbox.CFrame.Rotation.X
	}
	setTargetAttachment(attachment: Attachment | undefined) {
		this.logger.log(`Setting target attachment: ${attachment?.GetFullName()}`)
		this.target_attachment = attachment
		const model = this.getLogModel()!
		this.model = model
		const player = Players.LocalPlayer
		const char = player.Character
		const humanoid = char?.FindFirstChildOfClass("Humanoid")
		if (!char || !humanoid) return
		const hrp = char.FindFirstChild("HumanoidRootPart") as BasePart
		if (!hrp) return
	}
}
