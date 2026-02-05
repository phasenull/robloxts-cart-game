interface RaycastHitboxV4 {
	new: (part: BasePart, positions?: (Vector3|Attachment)[]) => Hitbox;
}
interface Hitbox {
	RaycastParams: RaycastParams,
	SetPoints: (this: Hitbox, part:BasePart, points: (Vector3|Attachment)[]) => void;
	OnHit: RBXScriptSignal<(hitPart: BasePart, humanoid: Humanoid) => void>;
	HitStart(): void
	HitStop(): void
	Visualizer: boolean
	DebugLog: boolean
	DetectionMode: number

}
declare const RaycastHitboxV4: RaycastHitboxV4;
export = RaycastHitboxV4;