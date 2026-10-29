import React, { useState } from "@rbxts/react"
import { GUI_KEYS } from "../constants"

export const GuiContext = React.createContext<{
	open_gui: string | undefined
	setOpenGui: React.Dispatch<React.SetStateAction<GUI_KEYS | undefined>>
	is_sidebar_open: boolean
	setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({
	open_gui: undefined,
	setOpenGui: () => {},
	is_sidebar_open: false,
	setIsSidebarOpen: () => {}
})

export function GuiProvider(props: { children: React.ReactNode; initial_gui?: GUI_KEYS }) {
	const [open_gui, set_open_gui] = useState<GUI_KEYS | undefined>(props.initial_gui)
	const [is_sidebar_open, set_is_sidebar_open] = useState<boolean>(true)

	return (
		<GuiContext.Provider
			value={{
				is_sidebar_open,
				setIsSidebarOpen: set_is_sidebar_open,
				open_gui,
				setOpenGui: set_open_gui
			}}
		>
			{props.children}
		</GuiContext.Provider>
	)
}
