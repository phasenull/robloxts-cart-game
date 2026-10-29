import { Players, SoundService, TweenService } from "@rbxts/services"
import { TypeTorch } from "@typetorch/framework"
import { A } from "shared/common/assets"
import Signal from "@rbxts/signal"
import { Environment } from "@rbxts/ui-labs";
import { FadeGuiEvent } from "./ui/gui/fade-gui";
const PITCH_VARIATION = 0.1;
interface PitchEntry {
	last_played: number;
	last_pitch: number;
}
export function calculatePitch(sound_id:string) {
	// plain data in persist (a local table in UI Labs edit mode), not module-level state
	const PITCH_CONFIG = TypeTorch.persist<Record<string, PitchEntry>>("ui.pitch.v1", () => ({}))
	const config = PITCH_CONFIG[sound_id]
	const now = tick()
	if (config && now - config.last_played < 1) {
		const new_pitch = (config.last_pitch + PITCH_VARIATION)
		PITCH_CONFIG[sound_id] = {
			last_played: now,
			last_pitch: new_pitch
		}
		return math.clamp(new_pitch,0,3)
	}
	PITCH_CONFIG[sound_id] = {
		last_played: now,
		last_pitch: 1
	}
	return 1
}
export interface ButtonBinding {
	instance: GuiButton
	connections: RBXScriptConnection[]
	original_size: UDim2
	signal: Signal<(event: "hover" | "click", state: boolean) => void>
}
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
	static playSound(soundId: string,allow_multiple: boolean = false) {
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
	/**
	 * Hover/click effects on a button. Returns the binding: keep it in the effect and pass it to unbind in the
	 * cleanup (the binding holds its own connections; nothing is kept in module-level state).
	 */
	static bind(instance: ImageButton | TextButton, rotate: number = 0): ButtonBinding {
		const original_size = instance.Size
		const binding: ButtonBinding = {
			instance,
			connections: [],
			original_size,
			signal: new Signal<(event: "hover" | "click", state: boolean) => void>(),
		}
		this.bindHoverEffects(binding, rotate)
		this.bindClickEffect(binding)
		return binding
	}
	static getEventListener(binding: ButtonBinding) {
		return binding.signal
	}
	static unbind(binding: ButtonBinding | undefined) {
		if (!binding) return
		for (const conn of binding.connections) {
			conn.Disconnect()
		}
		binding.signal.Destroy()
		binding.instance.Size = binding.original_size
	}
	private static bindHoverEffects(binding: ButtonBinding, rotate: number = 0) {
		const instance = binding.instance
		const originalSize = binding.original_size
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
		const signal = binding.signal
		binding.connections.push(
			instance.MouseEnter.Connect(() => {
				signal.Fire("hover", true)
				tween.Play()
			})
		)
		binding.connections.push(
			instance.MouseLeave.Connect(() => {
				signal.Fire("hover", false)
				reverseTween.Play()
			})
		)
	}
	private static bindClickEffect(binding: ButtonBinding) {
		const instance = binding.instance
		const originalSize = binding.original_size
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

		const signal = binding.signal
		binding.connections.push(
			instance.MouseButton1Down.Connect(() => {
				signal.Fire("click", true)
				tween.Play()
			})
		)
		binding.connections.push(
			instance.MouseButton1Up.Connect(() => {
				signal.Fire("click", false)
				reverseTween.Play()
			})
		)
		binding.connections.push(
			instance.MouseButton1Click.Connect(() => {
				this.playSound(A.sounds.click_hard)
			})
		)
	}
}
