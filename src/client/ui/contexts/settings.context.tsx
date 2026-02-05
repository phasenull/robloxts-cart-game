import React, { createContext, useState } from "@rbxts/react"
import { GUI_KEYS } from "../constants"

const SettingsContext = createContext<{
	animation_speed_multiplier: number
	setAnimationSpeedMultiplier: React.Dispatch<React.SetStateAction<number>>
}>({
	animation_speed_multiplier: 1,
	setAnimationSpeedMultiplier: () => {}
})

export function SettingsProvider(props: React.PropsWithChildren<{}>) {
	const [animation_speed_multiplier, setAnimationSpeedMultiplier] = useState(1)

	return (
		<SettingsContext.Provider
			value={{
				animation_speed_multiplier,
				setAnimationSpeedMultiplier
			}}
		>
			{props.children}
		</SettingsContext.Provider>
	)
}
export function useSettings() {
	return React.useContext(SettingsContext)
}
