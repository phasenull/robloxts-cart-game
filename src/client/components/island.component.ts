import { BaseComponent, Component } from "@flamework/components";
import { TweenService } from "@rbxts/services";
import {
	BuildWeldConstraints,
	MasslessPart,
	TweenValue,
} from "shared/util.helper";

@Component({ tag: "IslandComponent" })
export class IslandComponent extends BaseComponent<{}, Model> {
	constructor() {
		super();
		const root = MasslessPart(this.instance, "Root");
        root.PivotTo(this.instance.GetPivot())
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant === root) {
				return;
			}
			if (descendant.IsA("BasePart") && descendant.Name !== "Root") {
				descendant.Anchored = false;
				descendant.CanCollide = false;
				descendant.Massless = true;
				BuildWeldConstraints(root, descendant);
			}
		});
		root.Anchored = true;
		this.root = root;
		this.tween = TweenValue(
			new TweenInfo(
				this.time_seed,
				Enum.EasingStyle.Sine,
				Enum.EasingDirection.InOut,
				-1,
				true,
			),
			(alpha) => {
				this.root.CFrame = this.root.CFrame.mul(
					new CFrame(0, this.h_seed * alpha, 0),
				);
			},
		);
	}
	private readonly tween: Tween;
	private readonly h_seed = 3 + math.random(0, 3);
	private readonly time_seed = math.random(5, 10);
	private readonly root: BasePart;
    cleanup(): void {
        this.tween.Cancel()
        this.instance.Destroy()
    }
}
