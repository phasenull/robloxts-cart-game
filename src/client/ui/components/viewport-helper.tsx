import React, { useEffect, useMemo, useRef } from "@rbxts/react"
import { Workspace } from "@rbxts/services"

/**
 * Configuration options for the ViewportHelper component
 */
export interface ViewportHelperConfig {
	/** The model to display in the viewport */
	model: Model
	/** Whether to automatically fit the model to the viewport (default: true) */
	autoFit?: boolean
	/** Camera field of view in degrees (default: 70) */
	fieldOfView?: number
	/** Padding factor for auto-fit (1.0 = tight fit, higher = more padding) (default: 1.3) */
	fitPadding?: number
	/** Manual camera distance override (overrides auto-fit distance calculation) */
	cameraDistance?: number
	/** Additional offset to apply to the model position */
	modelOffset?: CFrame
	/** Custom camera CFrame (overrides auto-fit) */
	customCameraOffset?: CFrame
	/** Rotation to apply to the model (in radians) */
	modelRotation?: Vector3
	/** Ambient lighting color (default: white) */
	ambientColor?: Color3
	/** Light direction vector (default: Vector3(0, -1, -0.5)) */
	lightDirection?: Vector3
	/** Light color (default: white) */
	lightColor?: Color3
	/** Whether to animate model entrance with transparency fade (default: false) */
	animateEntrance?: boolean
	/** Entrance animation duration in seconds (default: 0.3) */
	entranceDuration?: number
	/** Size and position of the ViewportFrame (default: full size) */
	size?: UDim2
	/** Position of the ViewportFrame */
	position?: UDim2
	/** ZIndex of the ViewportFrame */
	zIndex?: number
}

/**
 * ViewportHelper - A utility component for managing ViewportFrame with 3D models
 * 
 * Features:
 * - Automatic model fitting and centering
 * - Camera positioning and FOV control
 * - Model rotation and positioning
 * - Lighting configuration
 * - Entrance animations
 * 
 * @example
 * ```tsx
 * // Auto-fit with custom rotation
 * <ViewportHelper
 *   model={myModel}
 *   autoFit={true}
 *   modelRotation={new Vector3(0, math.rad(45), 0)}
 *   ambientColor={Color3.fromRGB(150, 150, 150)}
 * />
 * 
 * // Make model appear bigger by reducing camera distance
 * <ViewportHelper
 *   model={myModel}
 *   cameraDistance={5}  // Closer = bigger
 *   fieldOfView={30}     // Smaller FOV = more zoomed in
 * />
 * 
 * // Offset model position
 * <ViewportHelper
 *   model={myModel}
 *   modelOffset={new CFrame(0, 2, 0)}  // Move model up
 * />
 * ```
 */
export function ViewportHelper(config: ViewportHelperConfig) {
	const {
		model,
		autoFit = true,
		fieldOfView = 70,
		fitPadding = 1.3,
		cameraDistance: manualCameraDistance,
		modelOffset,
		customCameraOffset,
		modelRotation,
		ambientColor = Color3.fromRGB(255, 255, 255),
		lightDirection = new Vector3(0, -1, -0.5),
		lightColor = Color3.fromRGB(255, 255, 255),
		animateEntrance = false,
		entranceDuration = 0.3,
		size = new UDim2(1, 0, 1, 0),
		position = new UDim2(0, 0, 0, 0),
		zIndex = 1,
	} = config

	const viewportRef = useRef<ViewportFrame>()
	const cameraRef = useRef<Camera>()
	const modelCloneRef = useRef<Model>()
	const animationConnectionRef = useRef<RBXScriptConnection>()
	const isInitializedRef = useRef(false)

	// Calculate bounding box and camera setup - only when model changes
	const { boundingBoxSize, boundingBoxCenter, calculatedCameraDistance } = useMemo(() => {
		if (!model) return { boundingBoxSize: new Vector3(), boundingBoxCenter: new Vector3(), calculatedCameraDistance: 0 }
		
		const [cf, size] = model.GetBoundingBox()
		const distance = calculateCameraDistance(size, fieldOfView, fitPadding)
		
		return {
			boundingBoxSize: size,
			boundingBoxCenter: cf.Position,
			calculatedCameraDistance: distance,
		}
	}, [model, fieldOfView, fitPadding])

	// Use manual camera distance if provided, otherwise use calculated
	const cameraDistance = manualCameraDistance ?? calculatedCameraDistance

	// Setup camera once
	useEffect(() => {
		if (!viewportRef.current) return

		let camera = cameraRef.current
		if (!camera) {
			// Try to find existing camera or create new one
			camera = Workspace.FindFirstChild("ViewportHelperCamera") as Camera
			if (!camera) {
				camera = new Instance("Camera")
				camera.Name = "ViewportHelperCamera"
				camera.Parent = Workspace
			}
			cameraRef.current = camera
			viewportRef.current.CurrentCamera = camera
		}

		camera.FieldOfView = fieldOfView

		return () => {
			// Only destroy camera on unmount
			if (cameraRef.current && !isInitializedRef.current) {
				cameraRef.current.Destroy()
			}
		}
	}, [fieldOfView])

	// Clone model only when the model reference changes
	useEffect(() => {
		if (!viewportRef.current || !model) return

		// Clean up old model if it exists
		if (modelCloneRef.current) {
			modelCloneRef.current.Destroy()
		}

		// Clone and setup new model
		const modelClone = model.Clone()
		modelCloneRef.current = modelClone
		modelClone.Parent = viewportRef.current

		// Make all parts non-collidable and anchored
		for (const descendant of modelClone.GetDescendants()) {
			if (descendant.IsA("BasePart")) {
				descendant.CanCollide = false
				descendant.Anchored = true
			}
		}

		// Animate entrance if enabled
		if (animateEntrance) {
			const parts: BasePart[] = []
			const originalTransparencies = new Map<BasePart, number>()
			
			for (const descendant of modelClone.GetDescendants()) {
				if (descendant.IsA("BasePart")) {
					parts.push(descendant)
					originalTransparencies.set(descendant, descendant.Transparency)
					descendant.Transparency = 1
				}
			}

			const startTime = os.clock()
			const connection = game.GetService("RunService").RenderStepped.Connect(() => {
				const elapsed = os.clock() - startTime
				const alpha = math.min(elapsed / entranceDuration, 1)
				
				for (const part of parts) {
					const originalTransparency = originalTransparencies.get(part) ?? 0
					part.Transparency = 1 - alpha * (1 - originalTransparency)
				}

				if (alpha >= 1) {
					connection.Disconnect()
				}
			})

			animationConnectionRef.current = connection
		}

		isInitializedRef.current = true

		return () => {
			if (animationConnectionRef.current) {
				animationConnectionRef.current.Disconnect()
			}
			if (modelCloneRef.current) {
				modelCloneRef.current.Destroy()
			}
		}
	}, [model, animateEntrance, entranceDuration])

	// Update positions/rotations without recreating model - runs separately
	useEffect(() => {
		if (!modelCloneRef.current || !cameraRef.current) return

		const modelClone = modelCloneRef.current
		const camera = cameraRef.current

		// Calculate model position (where the model will be placed)
		let modelPosition = new Vector3(0, 0, 0)
		let modelCFrame = new CFrame(0, 0, 0)
		
		if (modelOffset) {
			modelPosition = modelOffset.Position
			modelCFrame = modelOffset
		}
		
		if (modelRotation) {
			modelCFrame = modelCFrame.mul(CFrame.Angles(modelRotation.X, modelRotation.Y, modelRotation.Z))
		}

		// Position camera to look at the model
		let cameraCFrame: CFrame
		if (customCameraOffset) {
			cameraCFrame = customCameraOffset
		} else if (autoFit) {
			// Position camera at a distance from model, looking at the model position
			const cameraPosition = modelPosition.add(new Vector3(0, 0, cameraDistance))
			cameraCFrame = new CFrame(cameraPosition, modelPosition)
		} else {
			// Default camera position looking at model
			const cameraPosition = modelPosition.add(new Vector3(0, 0, 10))
			cameraCFrame = new CFrame(cameraPosition, modelPosition)
		}

		camera.CFrame = cameraCFrame
		modelClone.PivotTo(modelCFrame)
	}, [
		autoFit, 
		manualCameraDistance,
		modelOffset, 
		customCameraOffset, 
		modelRotation,
		cameraDistance
	])

	return (
		<viewportframe
			ref={viewportRef}
			BackgroundTransparency={1}
			Size={size}
			Position={position}
			ZIndex={zIndex}
			Ambient={ambientColor}
			LightColor={lightColor}
			LightDirection={lightDirection}
		/>
	)
}

/**
 * Calculate the appropriate camera distance to fit a model in the viewport
 * 
 * @param boundingBoxSize - The size of the model's bounding box
 * @param fieldOfView - Camera field of view in degrees
 * @param padding - Padding multiplier (1.0 = tight fit, higher = more space)
 * @returns The distance the camera should be from the model
 */
export function calculateCameraDistance(
	boundingBoxSize: Vector3,
	fieldOfView: number = 70,
	padding: number = 1.3
): number {
	// Use the larger dimension (width or height)
	const maxDimension = math.max(boundingBoxSize.X, boundingBoxSize.Y, boundingBoxSize.Z)
	
	// Convert FOV to radians and calculate half angle
	const fovRad = math.rad(fieldOfView)
	const halfAngle = fovRad / 2
	
	// Calculate distance using trigonometry
	// distance = (size / 2) / tan(halfAngle)
	const distance = (maxDimension / 2) / math.tan(halfAngle)
	
	return distance * padding
}

/**
 * Get the bounding box information for a model
 * 
 * @param model - The model to analyze
 * @returns Object containing center CFrame and size Vector3
 */
export function getModelBounds(model: Model): { center: CFrame; size: Vector3 } {
	const [center, size] = model.GetBoundingBox()
	return { center, size }
}

/**
 * Create a camera CFrame that looks at a target position
 * 
 * @param cameraPosition - Where the camera should be positioned
 * @param lookAtPosition - Where the camera should look
 * @returns A CFrame for the camera
 */
export function createLookAtCFrame(cameraPosition: Vector3, lookAtPosition: Vector3): CFrame {
	return new CFrame(cameraPosition, lookAtPosition)
}

/**
 * Position a model relative to a camera for viewport display
 * 
 * @param model - The model to position
 * @param camera - The camera to position relative to
 * @param distance - Distance from camera
 * @param offset - Additional offset (default: 0,0,0)
 * @param rotation - Rotation angles in radians (default: 0,0,0)
 */
export function positionModelInViewport(
	model: Model,
	camera: Camera,
	distance: number,
	offset: Vector3 = new Vector3(0, 0, 0),
	rotation: Vector3 = new Vector3(0, 0, 0)
): void {
	const cameraCFrame = camera.CFrame
	let modelCFrame = cameraCFrame.mul(new CFrame(offset.X, offset.Y, -distance + offset.Z))
	
	if (rotation.Magnitude > 0) {
		modelCFrame = modelCFrame.mul(CFrame.Angles(rotation.X, rotation.Y, rotation.Z))
	}
	
	model.PivotTo(modelCFrame)
}

/**
 * Create a viewport camera for use with ViewportFrames
 * 
 * @param parent - Where to parent the camera (typically Workspace)
 * @param name - Name for the camera (default: "ViewportCamera")
 * @returns The created camera instance
 */
export function createViewportCamera(parent: Instance = Workspace, name: string = "ViewportCamera"): Camera {
	const camera = new Instance("Camera")
	camera.Name = name
	camera.Parent = parent
	return camera
}

/**
 * Hook for managing a viewport camera with automatic cleanup
 * 
 * @param name - Unique name for this camera
 * @returns A camera instance that will be cleaned up on unmount
 */
export function useViewportCamera(name: string = "ViewportCamera"): Camera | undefined {
	const cameraRef = useRef<Camera>()

	useEffect(() => {
		const camera = createViewportCamera(Workspace, name)
		cameraRef.current = camera

		return () => {
			camera.Destroy()
		}
	}, [name])

	return cameraRef.current
}

/**
 * Apply material-based lighting adjustments to a model
 * Useful for making certain materials more visible in dark lighting
 * 
 * @param model - The model to adjust
 * @param brightness - Brightness multiplier (1.0 = normal)
 */
export function adjustModelLighting(model: Model, brightness: number = 1.0): void {
	for (const descendant of model.GetDescendants()) {
		if (descendant.IsA("BasePart")) {
			// Add point light to metallic/glass materials
			if (
				descendant.Material === Enum.Material.Glass ||
				descendant.Material === Enum.Material.Metal ||
				descendant.Material === Enum.Material.DiamondPlate
			) {
				const light = descendant.FindFirstChildOfClass("PointLight") as PointLight | undefined
				if (!light && brightness > 1.0) {
					const newLight = new Instance("PointLight")
					newLight.Brightness = (brightness - 1.0) * 2
					newLight.Range = 10
					newLight.Parent = descendant
				}
			}
		}
	}
}