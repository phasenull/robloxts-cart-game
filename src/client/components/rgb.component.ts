import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { TweenService, Workspace } from "@rbxts/services";

@Component({ tag: "RGBComponent" })
export class RgbComponent extends BaseComponent<{}, Model> implements OnStart {
	private readonly parts: BasePart[] = [];
	constructor() {
		super();
	}
	onStart(): void {
		// if (this.instance.Parent === Workspace) {
		// 	task.wait(0.05);
		// }
		task.wait(.3);
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				this.parts.push(descendant);
			}
		});
		this.parts.forEach((part) => {
			task.spawn(() => {
				let counter = 0;
				part.Color = Color3.fromHSV(0, 1, 1);
				while (true) {
					counter += 2;
					const hue = (counter % 10) / 10;
					const tweenInfo = new TweenInfo(
						1,
						Enum.EasingStyle.Linear,
						Enum.EasingDirection.InOut,
					);
					const tween = TweenService.Create(part, tweenInfo, {
						Color: Color3.fromHSV(hue, 1, 1),
					});
					tween.Play();
					tween.Completed.Wait();
				}
			});
		});
	}
}
