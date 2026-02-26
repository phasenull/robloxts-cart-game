import { Controller, OnStart } from "@flamework/core"
import { SoundService } from "@rbxts/services"
import { assets } from "shared/assets"

export const MusicVolume = {
	value: 0.5,
}

@Controller({ loadOrder: 1 })
export class MusicController implements OnStart {
	private sound: Sound | undefined
	private muted = false

	onStart(): void {
		this.playNext()
	}

	private getSongs(): Sound[] {
		return assets.musics.GetChildren().filter((c) => c.IsA("Sound")) as Sound[]
	}

	private playNext(): void {
		const songs = this.getSongs()
		if (songs.size() === 0) return

		const index = math.random(1, songs.size()) - 1
		const chosen = songs[index].Clone() as Sound
		chosen.Parent = SoundService
		chosen.Volume = this.muted ? 0 : .05
		chosen.Play()
		this.sound = chosen

		chosen.Ended.Once(() => {
			chosen.Destroy()
			this.playNext()
		})
	}

	setMuted(muted: boolean): void {
		this.muted = muted
		if (this.sound) {
			this.sound.Volume = muted ? 0 : MusicVolume.value
		}
	}

	isMuted(): boolean {
		return this.muted
	}
}
