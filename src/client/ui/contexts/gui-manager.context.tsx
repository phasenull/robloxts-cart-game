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
