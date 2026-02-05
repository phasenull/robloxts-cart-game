import { useEffect, useState } from "@rbxts/react"

export function useMouseEvents(ref: React.RefObject<ImageButton>) {
	const [state, setState] = useState<{
		isMouseDown: boolean
		isMouseOver: boolean
	}>({
		isMouseDown: false,
		isMouseOver: false
	})
	const onMouseEnter = () => {
		setState((prev) => ({ ...prev, isMouseOver: true }))
	}

	const onMouseLeave = () => {
		setState((prev) => ({ ...prev, isMouseOver: false, isMouseDown: false }))
	}

	const onMouseDown = () => {
		setState((prev) => ({ ...prev, isMouseDown: true }))
	}

	const onMouseUp = () => {
		setState((prev) => ({ ...prev, isMouseDown: false }))
	}
	useEffect(() => {
		const button = ref.current
		if (!button) {
			print("useMouseEvents: ref.current is undefined")
			return
		}

		const mouseEnterConn = button.MouseEnter.Connect(onMouseEnter)
		const mouseLeaveConn = button.MouseLeave.Connect(onMouseLeave)
		const mouseDownConn = button.MouseButton1Down.Connect(onMouseDown)
		const mouseUpConn = button.MouseButton1Up.Connect(onMouseUp)

		return () => {
			mouseEnterConn.Disconnect()
			mouseLeaveConn.Disconnect()
			mouseDownConn.Disconnect()
			mouseUpConn.Disconnect()
		}
	}, [ref])
	return state
}
