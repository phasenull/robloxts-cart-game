import { useEffect, useState } from "@rbxts/react"

export function useMouseHover(ref: React.RefObject<ImageButton>,callback:(isHovering:boolean)=>void) {
	const onMouseEnter = () => {
		callback(true)
	}

	const onMouseLeave = () => {
		callback(false)
	}
	useEffect(() => {
		const button = ref.current
		if (!button) {
			print("useMouseEvents: ref.current is undefined")
			return
		}

		const mouseEnterConn = button.MouseEnter.Connect(onMouseEnter)
		const mouseLeaveConn = button.MouseLeave.Connect(onMouseLeave)

		return () => {
			mouseEnterConn.Disconnect()
			mouseLeaveConn.Disconnect()
		}
	}, [ref,callback])
}
