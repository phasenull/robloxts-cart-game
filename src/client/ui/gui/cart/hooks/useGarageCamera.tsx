import { useEffect } from "@rbxts/react"
import { Workspace } from "@rbxts/services"

const GARAGE_PIVOT_PATH = ["GaragePreview", "CartPreviewAttachment"] as const
const GARAGE_FOV = 50
const GARAGE_CAMERA_OFFSET = new CFrame(-10, 5, -15)
const GARAGE_LOOK_AT_OFFSET = new Vector3(0, 2, 0)

/**
 * Hook to setup and manage the garage camera view
 * Automatically restores camera to normal when unmounted
 */
export function useGarageCamera() {
	useEffect(() => {
		const camera = Workspace.CurrentCamera
		const garagePreview = Workspace.FindFirstChild(GARAGE_PIVOT_PATH[0])
		const garagePivot = garagePreview?.FindFirstChild(
			GARAGE_PIVOT_PATH[1]
		) as Attachment | undefined

		if (!camera || !garagePivot) {
			warn("Garage camera setup failed: missing camera or garage pivot")
			return
		}

		// Store original camera settings
		const originalFOV = camera.FieldOfView
		const originalCameraType = camera.CameraType

		// Setup garage camera
		camera.CameraType = Enum.CameraType.Scriptable
		camera.FieldOfView = GARAGE_FOV

		// Position camera to look at garage
		const rootCFrame = garagePivot.WorldCFrame
		const cameraPosition = rootCFrame.mul(GARAGE_CAMERA_OFFSET).Position
		const lookAtPosition = garagePivot.WorldPosition.add(GARAGE_LOOK_AT_OFFSET)
		
		camera.CFrame = new CFrame(cameraPosition, lookAtPosition)

		// Cleanup: restore camera settings
		return () => {
			camera.FieldOfView = originalFOV
			camera.CameraType = originalCameraType
		}
	}, [])
}
