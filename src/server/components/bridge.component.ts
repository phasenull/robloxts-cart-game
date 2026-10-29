import type { Trove } from "@rbxts/trove"
import { homePivot, rigOnce, TaggedComponent } from "shared/component"
import { ProximityPrompt, TweenValue } from "shared/common/util.helper"
import { Tasks } from "shared/tasks"

type BridgeModel = Model & {
	1: Model
	2: Model
	Button: Model & {
		Color: BasePart
	}
}

const PROMPT_NAME = "BridgePrompt"

/**
 * Tag "BridgeComponent": a button that lowers the two bridge halves for 20 s. The prompt is world setup, handed over
 * between generations; a swap mid-way puts the bridge back up (its home pose) and the next press works as usual.
 */
export class BridgeComponent extends TaggedComponent<BridgeModel> {
	private readonly proximity_prompt: ProximityPrompt
	private readonly initial_states: {
		1: CFrame
		2: CFrame
		Button: Color3
	}
	private readonly tasks = new Tasks(this.trove)
	private tween: Tween | undefined
	constructor(instance: BridgeModel, trove: Trove) {
		super(instance, trove)
		rigOnce(this.instance, "bridge", () => {
			const prompt = ProximityPrompt(this.instance.Button.Color)
			prompt.Name = PROMPT_NAME
			prompt.ActionText = "Toggle Bridge"
			prompt.ObjectText = "Button"
			prompt.RequiresLineOfSight = false
			prompt.MaxActivationDistance = 10
			this.instance.Button.Color.SetAttribute("TypeTorchHome_bridge_color", this.instance.Button.Color.Color)
		})
		this.proximity_prompt = this.instance.Button.Color.FindFirstChild(PROMPT_NAME) as ProximityPrompt
		this.trove.connect(this.proximity_prompt.Triggered, () => {
			this.openBridge()
		})
		const home_color = this.instance.Button.Color.GetAttribute("TypeTorchHome_bridge_color")
		this.initial_states = {
			1: homePivot(this.instance["1"], "bridge"),
			2: homePivot(this.instance["2"], "bridge"),
			Button: typeIs(home_color, "Color3") ? home_color : this.instance.Button.Color.Color,
		}
		// Start up, whatever a previous generation left (a swap can stop it mid-way).
		this.instance["1"].PivotTo(this.initial_states[1])
		this.instance["2"].PivotTo(this.initial_states[2])
		this.instance.Button.Color.Color = this.initial_states.Button
		this.proximity_prompt.Enabled = true
		this.trove.add(() => this.tween?.Cancel())
	}
	private state: "up" | "down" = "up"
	openBridge() {
		if (this.state === "down") {
			return
		}
		this.proximity_prompt.Enabled = false
		this.instance.Button.Color.Color = new Color3(1, 0, 0)
		this.state = "down"
		this.tween?.Cancel()
		this.tween = TweenValue(
			new TweenInfo(2, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
			(alpha) => {
				this.instance["1"].PivotTo(
					this.initial_states[1].Lerp(
						this.initial_states[1].mul(CFrame.Angles(math.rad(-50), 0, 0)),
						alpha,
					),
				)
				this.instance[2].PivotTo(
					this.initial_states[2].Lerp(
						this.initial_states[2].mul(CFrame.Angles(math.rad(-50), 0, 0)),
						alpha,
					),
				)
			},
		)
		this.tasks.delay(20, () => {
			this.closeBridge()
		})
	}
	closeBridge() {
		if (this.state === "up") {
			return
		}
		this.proximity_prompt.Enabled = true
		this.instance.Button.Color.Color = this.initial_states.Button
		this.state = "up"
		this.tween?.Cancel()
		this.tween = TweenValue(
			new TweenInfo(2, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut),
			(alpha) => {
				this.instance["1"].PivotTo(
					this.instance["1"].GetPivot().Lerp(this.initial_states[1], alpha),
				)
				this.instance[2].PivotTo(
					this.instance["2"].GetPivot().Lerp(this.initial_states[2], alpha),
				)
			},
		)
	}
}
