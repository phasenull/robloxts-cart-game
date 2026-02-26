import React, { createContext, useState } from "@rbxts/react"
import { GUI_KEYS } from "../constants"
import { Dependency } from "@flamework/core"
import { MusicController } from "client/controllers/music.controller"

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
	const [animation_speed_multiplier, setAnimationSpeedMultiplier] = useState(1)
	const [musicMuted, setMusicMutedState] = useState(false)

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
