import { BaseComponent, Component } from "@flamework/components"
import { OnStart } from "@flamework/core"
import { Players, TweenService } from "@rbxts/services"
import Signal from "@rbxts/signal"
type ButtonModel = Model & {
	ButtonBase: Part
	ButtonTouch: Part
}
@Component({ tag: "ButtonComponent" })
export class ButtonComponent
	extends BaseComponent<{}, ButtonModel>
	implements OnStart
{
	private is_pressed: boolean = false
	private __cooldown: number = 0
	private readonly duration = 1
	private readonly default_h = this.instance.ButtonTouch.Position.Y
	private pressed_color = new Color3(1, 0, 0)
	private available_color = this.instance.ButtonTouch.Color
	constructor() {
		super()
	}
	onStart(): void {
		this.setPressed(true)
		this.instance.ButtonTouch.Touched.Connect((hit) => {
			const char = hit.Parent
			if (!char || !char.FindFirstChild("Humanoid")) {
				return
			}
			const player = Players.GetPlayerFromCharacter(char)
			if (!player) {
				return
			}
			this.setPressed(true,player)
		})
	}
	public readonly onPressed = new Signal<(player:Player) => void>()
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
			this.instance.ButtonTouch,
			new TweenInfo(0.3, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut),
			{
				Position: new Vector3(
					this.instance.ButtonBase.Position.X,
					new_pressed ? this.default_h : this.default_h + 0.4,
					this.instance.ButtonBase.Position.Z
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
