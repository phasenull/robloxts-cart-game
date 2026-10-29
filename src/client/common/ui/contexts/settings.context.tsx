import React, { createContext, useState } from "@rbxts/react"
import { GUI_KEYS } from "../constants"
import { Dependency } from "@typetorch/framework"
import { settingsState, type MusicController } from "client/controllers/music.controller";

const SettingsContext = createContext<{
	animation_speed_multiplier: number
	setAnimationSpeedMultiplier: React.Dispatch<React.SetStateAction<number>>
	musicMuted: boolean
	setMusicMuted: (muted: boolean) => void
}>({
	animation_speed_multiplier: 1,
	setAnimationSpeedMultiplier: () => {},
	musicMuted: false,
	setMusicMuted: () => {},
})

export function SettingsProvider(props: React.PropsWithChildren<{}>) {
	// Initial values from the settings kept across swaps (a local table in UI Labs edit mode)
	const saved = settingsState()
	const [animation_speed_multiplier, setAnimationSpeedMultiplierState] = useState(saved.animationSpeedMultiplier)
	const [musicMuted, setMusicMutedState] = useState(saved.musicMuted)

	const setAnimationSpeedMultiplier: React.Dispatch<React.SetStateAction<number>> = (value) => {
		setAnimationSpeedMultiplierState((previous) => {
			const updated = typeIs(value, "function") ? value(previous) : value
			settingsState().animationSpeedMultiplier = updated
			return updated
		})
	}

	const setMusicMuted = (muted: boolean) => {
		setMusicMutedState(muted)
		Dependency<MusicController>().setMuted(muted)
	}

	return (
		<SettingsContext.Provider
			value={{
				animation_speed_multiplier,
				setAnimationSpeedMultiplier,
				musicMuted,
				setMusicMuted,
			}}
		>
			{props.children}
		</SettingsContext.Provider>
	)
}
export function useSettings() {
	return React.useContext(SettingsContext)
}
