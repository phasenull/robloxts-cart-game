import { useEffect, useState } from "@rbxts/react";
import { Players } from "@rbxts/services";

export function useMouseDelta() {
	const [delta, setDelta] = useState<Vector2>(new Vector2(0, 0))
	const [viewportSize, setViewportSize] = useState<Vector2>(new Vector2(0, 0))
	useEffect(() => {
		const player = Players.LocalPlayer
		const mouse = player.GetMouse()
		setDelta(new Vector2(mouse.X, mouse.Y))
		setViewportSize(new Vector2(mouse.ViewSizeX, mouse.ViewSizeY))
		const connection = mouse.Move.Connect(() => {
			setDelta(new Vector2(mouse.X, mouse.Y))
		})
		return () => {
			connection.Disconnect()
		}
	}, [])
	return { delta, viewportSize }
}