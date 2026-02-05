import { Workspace } from "@rbxts/services";

/**
 * Calculates a smoothed CFrame for surface alignment using 4-point raycast sampling.
 * Casts rays in a + pattern around the hit position to average surface normals.
 *
 * @param hit_position - The position where the projectile hit
 * @param secondary_position - The origin position (camera or projectile start) used to determine incoming direction
 * @param sample_distance - Distance of sample points from center (default 0.5 studs)
 * @param raycast_params - Optional RaycastParams for filtering
 * @returns A CFrame positioned at hit_position and oriented to face away from the surface
 */
export function calculateSurfaceAlignedCFrame(
	hit_position: Vector3,
	secondary_position: Vector3,
	sample_distance: number = 0.5,
	raycast_params?: RaycastParams,
): CFrame {
	// Direction from secondary (camera/origin) toward hit position
	const incoming_direction = hit_position.sub(secondary_position).Unit;

	// Create orthogonal basis vectors for the + pattern sampling
	// Pick an arbitrary "up" that isn't parallel to incoming direction
	const arbitrary_up = math.abs(incoming_direction.Y) < 0.99 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
	const right = incoming_direction.Cross(arbitrary_up).Unit;
	const up = right.Cross(incoming_direction).Unit;

	// Sample points in + pattern (0.5 studs away from hit position)
	const sample_offsets = [
		right.mul(sample_distance), // Right
		right.mul(-sample_distance), // Left
		up.mul(sample_distance), // Up
		up.mul(-sample_distance), // Down
	];

	// Raycast from slightly behind hit position toward each sample point
	const ray_origin_offset = incoming_direction.mul(-1); // 1 stud behind hit position
	const ray_length = 2; // Cast 2 studs forward

	const params = raycast_params ?? new RaycastParams();
	const normals: Vector3[] = [];

	// Cast center ray first
	const center_ray = Workspace.Raycast(hit_position.add(ray_origin_offset), incoming_direction.mul(ray_length), params);
	if (center_ray) {
		normals.push(center_ray.Normal);
	}

	// Cast rays at each sample point
	for (const offset of sample_offsets) {
		const sample_origin = hit_position.add(offset).add(ray_origin_offset);
		const ray_result = Workspace.Raycast(sample_origin, incoming_direction.mul(ray_length), params);
		if (ray_result) {
			normals.push(ray_result.Normal);
		}
	}

	// Average the normals (or fallback to negative incoming direction)
	let averaged_normal: Vector3;
	if (normals.size() > 0) {
		let sum = new Vector3(0, 0, 0);
		for (const normal of normals) {
			sum = sum.add(normal);
		}
		averaged_normal = sum.div(normals.size()).Unit;
	} else {
		// Fallback: surface normal is opposite of incoming direction
		averaged_normal = incoming_direction.mul(-1);
	}

	// Build CFrame from the averaged normal
	// The normal becomes the "look" direction (facing away from surface)
	return createCFrameFromNormal(hit_position, averaged_normal);
}

/**
 * Creates a CFrame positioned at origin, with its LookVector aligned to the given normal.
 * Useful for orienting objects to face away from a surface.
 *
 * @param position - The position for the CFrame
 * @param normal - The surface normal (will become the LookVector)
 * @returns A CFrame at position facing along the normal
 */
function createCFrameFromNormal(position: Vector3, normal: Vector3): CFrame {
	// Pick an arbitrary vector that isn't parallel to normal for cross product
	const arbitrary = math.abs(normal.Y) < 0.99 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);

	// Calculate right and up vectors
	const right = normal.Cross(arbitrary).Unit;
	const up = right.Cross(normal).Unit;

	// CFrame.fromMatrix(pos, rightVector, upVector, -lookVector)
	// Since we want LookVector = normal, we pass -normal as the third parameter
	return CFrame.fromMatrix(position, right, up, normal.mul(-1));
}

/**
 * Simplified version that takes a pre-computed surface normal.
 * Use this when you already have the normal from a RaycastResult.
 *
 * @param hit_position - The position where the projectile hit
 * @param surface_normal - The surface normal at the hit point
 * @returns A CFrame positioned at hit_position and oriented to face away from the surface
 */
function calculateCFrameFromNormal(hit_position: Vector3, surface_normal: Vector3): CFrame {
	return createCFrameFromNormal(hit_position, surface_normal);
}