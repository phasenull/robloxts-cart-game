import { useContext } from "@rbxts/react"
import { GuiContext } from "../contexts/gui-manager.context"
import { useErrorPage } from "../contexts/error.context"

export function useNavigator() {
	const openGui = useContext(GuiContext).open_gui
	const setOpenGui = useContext(GuiContext).setOpenGui
	const closeAll = () => {
		clearErrors()
		setOpenGui(undefined)
	}
	const { clearErrors } = useErrorPage()
	return {
		openGui,
		setOpenGui: (gui: string) => {
			clearErrors()
			setOpenGui((old) => (old === gui ? undefined : gui))
		},
		closeAll
	}
}
