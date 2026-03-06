import { ProximityPrompt, TweenValue } from "@common/shared/util.helper";
import { BaseComponent, Component } from "@flamework/components";

@Component({ tag: "BridgeComopnent" })
export class BridgeComponent extends BaseComponent<
	{},
	Model & {
		1: Model;
		2: Model;
		Button: Model & {
			Color: BasePart;
		};
	}
> {
	private readonly proximity_prompt: ProximityPrompt;
	private readonly initial_states: {
		1: CFrame;
		2: CFrame;
		Button: Color3;
	};
	constructor() {
		super();
		this.proximity_prompt = ProximityPrompt(this.instance.Button);
		this.proximity_prompt.Triggered.Connect(() => {});
		this.initial_states = {
			1: this.instance["1"].GetPivot(),
			2: this.instance["2"].GetPivot(),
			Button: this.instance.Button.Color.Color,
		};
	}
	private state: "up" | "down" = "up";
	openBridge() {
		if (this.state === "down") {
			return;
		}
        this.proximity_prompt.Enabled = false;
		this.state = "down";
		TweenValue(
			new TweenInfo(2, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
			(alpha) => {
				this.instance["1"].PivotTo(
					this.initial_states[1].Lerp(
						this.initial_states[1].mul(CFrame.Angles(math.rad(-50), 0, 0)),
						alpha,
					),
				);
				this.instance[2].PivotTo(
					this.initial_states[2].Lerp(
						this.initial_states[2].mul(CFrame.Angles(math.rad(50), 0, 0)),
						alpha,
					),
				);
			},
		);
	}
	closeBridge() {
		if (this.state === "up") {
			return;
		}
        this.proximity_prompt.Enabled = true;
		this.state = "up";
		TweenValue(
			new TweenInfo(2, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
			(alpha) => {
				this.instance["1"].PivotTo(
					this.initial_states[1].Lerp(this.initial_states[1], 1 - alpha),
				);
				this.instance[2].PivotTo(
					this.initial_states[2].Lerp(this.initial_states[2], 1 - alpha),
				);
			},
		);
	}
}
