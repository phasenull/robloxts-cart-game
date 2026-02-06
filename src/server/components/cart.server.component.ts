import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { Players } from "@rbxts/services"
import { t } from "@rbxts/t"
import { Logger } from "shared/logger"
import { ICart, IWheel } from "shared/type.helper"

@Component({ tag: "CartComponent",instanceGuard: t.instanceOf("Model") })
export class CartServerComponent
	extends BaseComponent<{}, ICart>
	implements OnStart
{
	cleanup(): void {
		this.logger.log(`Cleaning up cart: ${this.instance.GetFullName()}`)
		this.instance.Destroy()
		this.destroy()
	}
	onStart(): void {
		const seat = this.instance.VehicleSeat
		seat.GetPropertyChangedSignal("Occupant").Connect(() => {
			const player = Players.GetPlayerFromCharacter(
				seat.Occupant?.Parent as Model
			)
			if (!player) {
				this.cleanup()
				return
			}
			this.setOwnership(player)
			const char = player.Character
			char?.GetDescendants().forEach((descendant) => {
				if (descendant.IsA("BasePart")) {
					descendant.Massless = true
				}
			})
		})
	}
	constructor(private logger: Logger) {
		super()
		const visuals = this.instance.FindFirstChild("Visuals") as Model
		// cart physics and stuff
		const wheels = this.instance.Wheels
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart") && descendant.Name !== "Mass") {
				descendant.Massless = true
				if (descendant.IsDescendantOf(visuals) ||(descendant.IsDescendantOf(wheels) && descendant.Name !== "BALL")) {
					descendant.CanCollide = false
				}
			}
		})
		// handle wheels
		wheels.GetChildren().forEach((_) => {
			if (!_.IsA("Model")) return
			const model = _ as IWheel
			const wheel = model.WHEEL
			const connection = model.CONNECTION
			const ball = model.BALL
			const attachment_ball = new Instance("Attachment",ball)
			const attachment_connection = new Instance("Attachment",connection)
			attachment_connection.Position = new Vector3(0, -connection.Size.Y / 2, 0)
			attachment_ball.Name = "ball->connection"
			attachment_connection.Name = "connection->ball"
			const attachment_root_to_connection = new Instance("Attachment",this.instance.Root)
			attachment_root_to_connection.WorldCFrame = attachment_connection.WorldCFrame
			attachment_root_to_connection.Orientation = new Vector3(0, 0, 90)
			attachment_root_to_connection.Name = "root->connection"
			const attachment_connector_to_root = new Instance("Attachment",connection)
			attachment_connector_to_root.Name = "connection->root"
			attachment_connector_to_root.WorldCFrame = attachment_connection.WorldCFrame
			attachment_connector_to_root.Orientation = new Vector3(0, 0, 90)
			// connector
			
			
			const hinge_constraint = new Instance("HingeConstraint", connection)
			hinge_constraint.Attachment1 = attachment_connector_to_root
			hinge_constraint.Attachment0 = attachment_root_to_connection

			// ball
			// const weld_constraints = new Instance("WeldConstraint", ball)
			// weld_constraints.Part0 = connection
			// weld_constraints.Part1 = ball
			// ball.Position = connection.Position.sub(new Vector3(0, connection.Size.Y / 2 + ball.Size.Y/2, 0))
			ball.Transparency = 1
		
			const ballsocket = new Instance("BallSocketConstraint", ball)
			ballsocket.Attachment0 = attachment_connection
			ballsocket.Attachment1 = attachment_ball
			
			// wheel
			const weld_wheel = new Instance("Weld", wheel)
			weld_wheel.Part1 = wheel
			weld_wheel.Part0 = connection
			weld_wheel.C0 = new CFrame(0, -connection.Size.Y / 2, 0)
			const wheel_mass = new Instance("Part", wheel)
			wheel_mass.Name = "Mass"
			wheel_mass.Size = new Vector3(1, 1, 1)
			wheel_mass.Transparency = 1
			wheel_mass.CanCollide = false
			wheel_mass.Massless = true
		
			const weld_mass = new Instance("Weld", wheel_mass)
			weld_mass.Part0 = wheel
			weld_mass.Part1 = wheel_mass
			weld_mass.C0 = new CFrame(.3, 0, 0)
				.mul(CFrame.Angles(math.rad(90), 0, 0))
			wheel_mass.Parent = this.instance
		})
	}
	setOwnership(owner?: Player): void {
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				descendant.SetNetworkOwner(owner ?? undefined)
			}
		})
	}
}
