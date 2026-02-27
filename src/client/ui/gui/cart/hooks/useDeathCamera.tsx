import { useEffect } from "@rbxts/react"
import { Players, Workspace } from "@rbxts/services"
import useAnimateValue from "@common/client/ui/hooks/useAnimateValue"

interface UseDeathCameraProps {
	spawnPoint: CFrame | undefined
	shouldShow: boolean
}

export function useDeathCamera({ spawnPoint, shouldShow }: UseDeathCameraProps) {
	const rotation = useAnimateValue({
		initial_value: 0,
		target_value: 1,
		tween_info: new TweenInfo(10, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, -1),
		enabled: shouldShow
	})

	const distance = 16
	const target_cframe = spawnPoint
		? CFrame.lookAt(
				new CFrame(spawnPoint.Position)
					.mul(CFrame.Angles(0, math.rad(rotation * 360), 0))
					.mul(new CFrame(0, 5, -distance)).Position,
				spawnPoint.Position
			)
		: undefined

	useEffect(() => {
		const camera = Workspace.CurrentCamera
		if (!camera) return

		if (target_cframe) {
			camera.CameraType = Enum.CameraType.Scriptable
			camera.CFrame = target_cframe
		} else {
			camera.CameraType = Enum.CameraType.Custom
			const char = Players.LocalPlayer.Character
			if (char && char.PrimaryPart) {
				camera.CameraSubject = char.PrimaryPart
			}
		}
	}, [target_cframe,shouldShow])

	// Cleanup camera on unmount
	useEffect(() => {
		return () => {
			const camera = Workspace.CurrentCamera
			if (camera) {
				camera.CameraType = Enum.CameraType.Custom
			}
		}
	}, [shouldShow,spawnPoint])

	return { rotation }
}
