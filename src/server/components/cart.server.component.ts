import { BaseComponent, Component } from "@flamework/components"
import { OnPhysics, OnStart } from "@flamework/core"
import { Players } from "@rbxts/services"
import { t } from "@rbxts/t"
import { __IS_STUDIO__ } from "shared/config.helper"
import { Logger } from "shared/logger"
import { ICart, IWheel } from "shared/type.helper"
import { BuildDeepWeldConstraints, BuildWeldConstraints, MasslessPart } from "shared/util.helper"

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
		logger.log(`Initializing cart: ${this.instance.GetFullName()}`)

		// build required parts
		const wheels = this.instance.Wheels
		const [bounding_box,size] = this.instance.GetBoundingBox()
		const mass_part = MasslessPart(this.instance,"Mass")
		mass_part.Size = new Vector3(2.712, 1, 2.475)
		mass_part.CFrame = bounding_box.mul(new CFrame(0, -1, 0))
		mass_part.Massless = false
		
		const root_part = MasslessPart(this.instance,"Root")
		root_part.CFrame = bounding_box
		root_part.Color = new Color3(0, 0.9, 1)
		const vector_force = new Instance("VectorForce", root_part)
		vector_force.Force = new Vector3(0, 0, 0)
		vector_force.Attachment0 = new Instance("Attachment", root_part)
		vector_force.Attachment0.Name = "Root"
		vector_force.RelativeTo = Enum.ActuatorRelativeTo.World
		// build vehicle seat
		const seat = new Instance("Seat", this.instance)
		seat.Name = "VehicleSeat"
		seat.Size = new Vector3(4.278, 0.332, 5.622)
		seat.CFrame = bounding_box.mul(new CFrame(0, -0.5, 0))
		seat.Transparency = __IS_STUDIO__ ? 0.5 : 1
		seat.CanCollide = false
		BuildWeldConstraints(root_part, seat)
		BuildWeldConstraints(root_part, mass_part)
		BuildDeepWeldConstraints(root_part, visuals)
		// build balls
		
		this.instance.Wheels.GetChildren().forEach((_) => {
			if (!_.IsA("Model")) return
			const model = _ as IWheel
			const ball = MasslessPart(model,`BALL`)
			ball.Shape = Enum.PartType.Ball
			ball.CFrame = model.GetPivot()
			ball.CanCollide = true
			logger.log(`Built ball for wheel: ${model.GetFullName()}`)
		})
		this.instance.PrimaryPart = root_part
		// cart physics and stuff
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
			attachment_connection.Position = new Vector3(0, 0, connection.Size.Z / 2)
			attachment_ball.Name = "ball->connection"
			attachment_connection.Name = "connection->ball"
			const attachment_root_to_connection = new Instance("Attachment",this.instance.Root)
			attachment_root_to_connection.WorldCFrame = attachment_connection.WorldCFrame
			attachment_root_to_connection.Orientation = new Vector3(0, 0, 90)
			attachment_root_to_connection.Name = "root->connection"
			const attachment_connector_to_root = new Instance("Attachment",connection)
			attachment_connector_to_root.Name = "connection->root"
			attachment_connector_to_root.WorldCFrame = attachment_connection.WorldCFrame
			attachment_connector_to_root.Orientation = new Vector3(0, 90, 0)
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
			weld_wheel.C0 = new CFrame(0, 0, connection.Size.Z / 2)
			// const following_mass = new Instance("Part", wheel)
			// following_mass.Name = "Mass"
			// following_mass.Size = new Vector3(1, 1, 1)
			// following_mass.Transparency = 1
			// following_mass.CanCollide = false
			// following_mass.Massless = true
			const align_orientation = new Instance("AlignOrientation", following_mass)
			const weld_mass = new Instance("Weld", following_mass)
			weld_mass.Part0 = wheel
			weld_mass.Part1 = following_mass
			weld_mass.C0 = new CFrame(.3, 0, 0)
				.mul(CFrame.Angles(math.rad(90), 0, 0))
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
