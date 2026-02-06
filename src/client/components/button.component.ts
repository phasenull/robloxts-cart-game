import { BaseComponent, Component } from "@flamework/components"
import { OnStart } from "@flamework/core"
import { Players, TweenService } from "@rbxts/services"
import Signal from "@rbxts/signal"
import { ButtonModel } from "shared/type.helper"

@Component({ tag: "ButtonComponent" })
export class ButtonComponent
	extends BaseComponent<{}, ButtonModel>
	implements OnStart
{
	private is_pressed: boolean = false
	private __cooldown: number = 0
	private readonly duration = 1
	private readonly default_h: number
	private readonly pressed_color = new Color3(1, 0, 0)
	private readonly available_color: Color3
	private readonly touch: BasePart
	private readonly spawn_platform: CFrame
	constructor() {
		super()
		this.instance["Spawn Button"].WaitForChild("Part",9999999)
		const touch = this.instance["Spawn Button"]
			.GetChildren()
			.find(
				(child) =>
					child.IsA("BasePart") && child.Size === new Vector3(3, 0.7, 3)
			) as Part
		if (!touch)
			assert(
				touch,
				"Could not find button touch part, available parts: " +
					this.instance["Spawn Button"]
						.GetChildren()
						.map((c) => c.Name)
						.join(", ")
			)
		this.touch = touch
		this.default_h = touch.Position.Y
		this.available_color = touch.Color
		const spawn_platform = this.instance["SpawnPlatform"]
			.GetChildren()
			.find(
				(child) =>
					child.IsA("BasePart") && child.Size === new Vector3(8, 0.2, 6)
			) as BasePart
		assert(spawn_platform, "Could not find spawn platform")
		this.spawn_platform = spawn_platform.GetPivot()
		touch.Name = "ButtonTouch"
	}
	onStart(): void {
		this.setPressed(true)
		this.touch.Touched.Connect((hit) => {
			const char = hit.Parent
			if (!char || !char.FindFirstChild("Humanoid")) {
				return
			}
			const player = Players.GetPlayerFromCharacter(char)
			if (!player) {
				return
			}
			this.setPressed(true, player)
		})
	}
	public readonly onPressed = new Signal<(player: Player) => void>()
	setPressed(new_pressed: boolean, player?: Player) {
		if (this.is_pressed === new_pressed) {
			return
		}
		if (this.__cooldown + this.duration > tick()) {
			return
		}
		this.__cooldown = tick()
		this.is_pressed = new_pressed
		TweenService.Create(
			this.touch,
			new TweenInfo(0.3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
			{
				Position: new Vector3(
					this.touch.Position.X,
					new_pressed ? this.default_h : this.default_h + 0.4,
					this.touch.Position.Z
				),
				Color: new_pressed ? this.pressed_color : this.available_color
			}
		).Play()
		if (new_pressed && player) {
			this.onPressed.Fire(player)
		}
		task.delay(this.duration, () => {
			this.setPressed(false)
		})
	}

	cleanup() {}
}
