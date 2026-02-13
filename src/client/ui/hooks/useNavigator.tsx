import { useContext } from "@rbxts/react"
import { GuiContext } from "../contexts/gui-manager.context"
import { useErrorPage } from "../contexts/error.context"

export function useNavigator() {
	const context = useContext(GuiContext)
	const openGui = context.open_gui
	const setOpenGui = context.setOpenGui
	const isSidebarOpen = context.is_sidebar_open
	const setIsSidebarOpen = context.setIsSidebarOpen
	const { clearErrors } = useErrorPage()
	
	const closeAll = () => {
		clearErrors()
		setOpenGui(undefined)
	}
	
	return {
		openGui,
		setOpenGui: (gui: string) => {
			clearErrors()
			setOpenGui((old) => (old === gui ? undefined : gui))
		},
		closeAll,
		isSidebarOpen,
		setIsSidebarOpen,
		toggleSidebar: () => setIsSidebarOpen((prev) => !prev)
	}
}
