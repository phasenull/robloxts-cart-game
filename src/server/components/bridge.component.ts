import { ProximityPrompt, TweenValue } from "@common/shared/util.helper";
import { BaseComponent, Component } from "@flamework/components";

@Component({ tag: "BridgeComponent" })
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
		this.proximity_prompt = ProximityPrompt(this.instance.Button.Color);
        this.proximity_prompt.ActionText = "Toggle Bridge";
        this.proximity_prompt.ObjectText = "Button";
        this.proximity_prompt.RequiresLineOfSight = false;
        this.proximity_prompt.MaxActivationDistance = 10
		this.proximity_prompt.Triggered.Connect(() => {
            this.openBridge()
        });
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
		this.instance.Button.Color.Color = new Color3(1, 0, 0);
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
						this.initial_states[2].mul(CFrame.Angles(math.rad(-50), 0, 0)),
						alpha,
					),
				);
			},
		);
        task.delay(20, () => {
            this.closeBridge()
        })
	}
	closeBridge() {
		if (this.state === "up") {
			return;
		}
        this.proximity_prompt.Enabled = true;
		this.instance.Button.Color.Color = this.initial_states.Button;
		this.state = "up";
		TweenValue(
			new TweenInfo(2, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
			(alpha) => {
				this.instance["1"].PivotTo(
					this.instance["1"].GetPivot().Lerp(this.initial_states[1], alpha),
				);
				this.instance[2].PivotTo(
					this.instance["2"].GetPivot().Lerp(this.initial_states[2], alpha),
				);
			},
		);
	}
}
