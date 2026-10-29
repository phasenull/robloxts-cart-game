import { SoundService } from "@rbxts/services";
import { Controller, Module, TypeTorch, type OnStart } from "@typetorch/framework";
import { assets } from "shared/common/assets";

export const MusicVolume = {
	value: 0.05,
};

/** Player settings that survive swaps (plain data); the settings UI and this controller share it. */
export interface SettingsState {
	musicMuted: boolean;
	animationSpeedMultiplier: number;
}
export function settingsState(): SettingsState {
	return TypeTorch.persist<SettingsState>("settings.v1", () => ({ musicMuted: false, animationSpeedMultiplier: 1 }));
}

/** The song playing, so the next generation carries on with it instead of starting another. */
interface Playing {
	song?: string;
	position: number;
	at: number;
}

@Controller({ loadOrder: 1 })
export class MusicController extends Module implements OnStart {
	private sound: Sound | undefined;
	private muted = false;
	private playing!: Playing;

	onStart(): void {
		this.muted = settingsState().musicMuted;
		this.playing = this.ctx.persist<Playing>("music.playing.v1", () => ({ position: 0, at: 0 }));
		// The song belongs to this generation; note where it was so the next one resumes it.
		this.trove.add(() => {
			const sound = this.sound;
			this.sound = undefined;
			if (!sound) return;
			this.playing.song = sound.Name;
			this.playing.position = sound.TimePosition;
			this.playing.at = os.clock();
			sound.Destroy();
		});
		const resume = this.playing.song;
		this.playing.song = undefined;
		const song = resume !== undefined ? this.getSongs().find((s) => s.Name === resume) : undefined;
		this.playNext(song, song ? this.playing.position + (os.clock() - this.playing.at) : 0);
	}

	private getSongs(): Sound[] {
		return assets.musics.GetChildren().filter((c) => c.IsA("Sound")) as Sound[];
	}

	private playNext(resume?: Sound, position = 0): void {
		const songs = this.getSongs();
		if (songs.size() === 0) return;

		const index = math.random(1, songs.size()) - 1;
		const chosen = (resume ?? songs[index]).Clone() as Sound;
		chosen.Parent = SoundService;
		chosen.Volume = this.muted ? 0 : 0.05;
		if (position > 0 && position < chosen.TimeLength) chosen.TimePosition = position;
		chosen.Play();
		this.sound = chosen;

		chosen.Ended.Once(() => {
			chosen.Destroy();
			this.playNext();
		});
	}

	setMuted(muted: boolean): void {
		this.muted = muted;
		settingsState().musicMuted = muted;
		if (this.sound) {
			this.sound.Volume = muted ? 0 : MusicVolume.value;
		}
	}

	isMuted(): boolean {
		return this.muted;
	}
}
