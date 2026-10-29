import { Players, TweenService } from "@rbxts/services"
import Signal from "@rbxts/signal"
import type { Trove } from "@rbxts/trove"
import { Logger } from "shared/common/logger"
import { homePivot, homeValue, TaggedComponent } from "shared/component"
import { network } from "shared/net"
import { Tasks } from "shared/tasks"
import { ButtonModel } from "shared/type.helper"

/** Tag "ButtonComponent": a pressable pad; a cart spawner (under the CartSpawners folder) asks the server for a cart. */
export class ButtonComponent extends TaggedComponent<ButtonModel> {
	private readonly logger = new Logger("button.component")
	private readonly tasks = new Tasks(this.trove)
	private is_pressed: boolean = false
	private __cooldown: number = 0
	private readonly duration = 0.5
	private readonly default_h: number
	private readonly pressed_color = new Color3(1, 0, 0)
	private readonly available_color: Color3
	private readonly touch: BasePart
	private readonly spawn_platform: CFrame
	constructor(instance: ButtonModel, trove: Trove) {
		super(instance, trove)
		this.trove.add(this.onPressed)
		this.instance["Spawn Button"].WaitForChild("Part", 2)
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
		// Home pose and colour, so a swap mid-press doesn't make the pressed state the new default
		const home = homePivot(touch, "button")
		this.default_h = home.Position.Y
		this.available_color = homeValue(touch, "button_color", touch.Color)
		touch.PivotTo(home)
		touch.Color = this.available_color
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
		this.trove.connect(this.touch.Touched, (hit) => {
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
					new_pressed ? this.default_h - 0.4 : this.default_h,
					this.touch.Position.Z
				),
				Color: new_pressed ? this.pressed_color : this.available_color
			}
		).Play()
		if (new_pressed && player) {
			this.onPressed.Fire(player)
		}
		if (player === Players.LocalPlayer){
			if (
				this.instance.FindFirstAncestorOfClass("Folder")?.Name ===
				"CartSpawners"
			) {
				network.client.CartService.spawnCart.fire(this.instance)
			}
		}
		this.tasks.delay(this.duration, () => {
			this.setPressed(false)
		})
	}
}
