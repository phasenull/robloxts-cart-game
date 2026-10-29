import type { Trove } from "@rbxts/trove"
import { homePivot, rigOnce, TaggedComponent } from "shared/component"
import { BuildWeldConstraints, MasslessPart, TweenValue } from "shared/common/util.helper"

/**
 * Tag "IslandComponent" (Model): a floating island bobbing up and down. The welded rig is world setup, handed over
 * between generations; the bobbing tween is per generation and starts again from the island's home pose.
 */
export class IslandComponent extends TaggedComponent<Model> {
	private readonly tween: Tween
	private readonly h_seed = 3 + math.random(0, 3)
	private readonly time_seed = math.random(5, 10)
	private readonly root: BasePart
	constructor(instance: Model, trove: Trove) {
		super(instance, trove)
		rigOnce(this.instance, "island", () => {
			const root = MasslessPart(this.instance, "Root")
			root.PivotTo(this.instance.GetPivot())
			this.instance.GetDescendants().forEach((descendant) => {
				if (descendant === root) {
					return
				}
				if (descendant.IsA("BasePart") && descendant.Name !== "Root") {
					descendant.Anchored = false
					descendant.CanCollide = false
					descendant.Massless = true
					BuildWeldConstraints(root, descendant)
				}
			})
			root.Anchored = true
		})
		this.root = this.instance.FindFirstChild("Root") as BasePart
		this.root.CFrame = homePivot(this.root, "island")
		this.tween = TweenValue(
			new TweenInfo(this.time_seed, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
			(alpha) => {
				this.root.CFrame = this.root.CFrame.mul(new CFrame(0, this.h_seed * alpha, 0))
			},
		)
		this.trove.add(() => this.tween.Cancel())
	}
}
