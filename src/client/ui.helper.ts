import { Players, SoundService, TweenService } from "@rbxts/services"
import { A } from "../shared/assets"
import Signal from "@rbxts/signal"
import { FadeGuiEvent } from "./ui/gui/fade-gui";
import { Environment } from "@rbxts/ui-labs";

export abstract class UIHelper {
	static toggleFade(toggle: boolean) {
		FadeGuiEvent.Fire(toggle)
	}
	static getSoundGroup(name: string) {
		const existing = SoundService.FindFirstChild(name) as SoundGroup | undefined
		if (existing) {
			return existing
		}
		const new_group = new Instance("SoundGroup")
		new_group.Name = name
		new_group.Parent = SoundService
		return new_group
	}
	static playSound(soundId: string) {
		const environment =
			Environment?.PluginWidget ||
			Players.LocalPlayer?.FindFirstChildOfClass("PlayerGui")
		const does_exist = (environment as Instance)?.FindFirstChild(
			`UIHelperSound_${soundId}`
		) as Sound | undefined
		// if (does_exist) {
		// 	does_exist.Play()
		// 	return
		// }
		const sound = new Instance("Sound")
		sound.Name = `UIHelperSound_${soundId}`
		sound.SoundId = soundId
		sound.Parent = environment
		sound.PlaybackSpeed = 1
		sound.Volume = 0.5
		sound.Play()
		sound.SoundGroup = this.getSoundGroup("UIHelperSoundGroup")
		sound.Ended.Once(() => {
			sound.Destroy()
		})
		return sound
	}
	static bind(instance: ImageButton | TextButton, rotate: number = 0) {
		const original_size = instance.Size
		this.events.set(instance, { connections: [], original_size })
		this.signals.set(
			instance,
			new Signal<(event: "hover" | "click", state: boolean) => void>()
		)
		this.bindHoverEffects(instance, original_size, rotate)
		this.bindClickEffect(instance, original_size)
		return this.events.get(instance)
	}
	private static readonly signals = new Map<
		GuiButton,
		Signal<(event: "hover" | "click", state: boolean) => void>
	>()
	static getEventListener(instance: GuiButton) {
		const entry = this.signals.get(instance)
		return entry
	}
	static unbind(instance: GuiButton) {
		const entry = this.events.get(instance)
		if (entry) {
			for (const conn of entry.connections) {
				conn.Disconnect()
			}
			instance.Size = entry.original_size
			this.events.delete(instance)
		}
	}
	static events: Map<
		GuiButton,
		{ connections: RBXScriptConnection[]; original_size: UDim2 }
	> = new Map()
	private static bindHoverEffects(
		instance: GuiButton,
		originalSize?: UDim2,
		rotate: number = 0
	) {
		originalSize = originalSize ?? instance.Size
		const tween = TweenService.Create(
			instance,
			new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{
				Size: new UDim2(
					originalSize?.X.Scale * 1.1,
					originalSize?.X.Offset ?? instance.Size.X.Offset,
					originalSize?.Y.Scale * 1.1,
					originalSize?.Y.Offset ?? instance.Size.Y.Offset
				),
				Rotation: rotate
			}
		)
		const reverseTween = TweenService.Create(
			instance,
			new TweenInfo(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{
				Size: new UDim2(
					originalSize?.X.Scale,
					originalSize?.X.Offset ?? instance.Size.X.Offset,
					originalSize?.Y.Scale,
					originalSize?.Y.Offset ?? instance.Size.Y.Offset
				),
				Rotation: 0
			}
		)
		const entry = this.events.get(instance)
		const signal = this.signals.get(instance)
		if (entry) {
			entry.connections.push(
				instance.MouseEnter.Connect(() => {
					signal?.Fire("hover", true)
					tween.Play()
				})
			)
			entry.connections.push(
				instance.MouseLeave.Connect(() => {
					signal?.Fire("hover", false)
					reverseTween.Play()
				})
			)
			this.events.set(instance, entry)
		}
	}
	private static bindClickEffect(instance: GuiButton, originalSize?: UDim2) {
		originalSize = originalSize ?? instance.Size
		const tween = TweenService.Create(
			instance,
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{
				Size: new UDim2(
					originalSize.X.Scale * 0.9,
					originalSize?.X.Offset ?? instance.Size.X.Offset,
					originalSize?.Y.Scale * 0.9,
					originalSize?.Y.Offset ?? instance.Size.Y.Offset
				)
			}
		)
		const reverseTween = TweenService.Create(
			instance,
			new TweenInfo(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			{
				Size: new UDim2(
					originalSize.X.Scale / 0.9,
					originalSize?.X.Offset ?? instance.Size.X.Offset,
					originalSize?.Y.Scale / 0.9,
					originalSize?.Y.Offset ?? instance.Size.Y.Offset
				)
			}
		)

		const entry = this.events.get(instance)
		const signal = this.signals.get(instance)
		if (entry) {
			entry.connections.push(
				instance.MouseButton1Down.Connect(() => {
					signal?.Fire("click", true)
					tween.Play()
				})
			)
			entry.connections.push(
				instance.MouseButton1Up.Connect(() => {
					signal?.Fire("click", false)
					reverseTween.Play()
				})
			)
			entry.connections.push(
				instance.MouseButton1Click.Connect(() => {
					this.playSound(A.sounds.click_hard)
				})
			)
			this.events.set(instance, entry)
		}
	}
}
