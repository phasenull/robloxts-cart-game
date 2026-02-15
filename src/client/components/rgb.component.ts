import { BaseComponent, Component } from "@flamework/components";
import { TweenService } from "@rbxts/services";

@Component({tag:"RGBComponent"})
export class RgbComponent extends BaseComponent<{},Model> {
	private readonly parts: BasePart[] = [];
	constructor() {
		super();
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				this.parts.push(descendant);
			}
		});
		this.parts.forEach((part) => {
			task.spawn(() => {
					print("Starting RGB tween for part:", part.Name);
				let counter = 0
				part.Color = Color3.fromHSV(0,1,1)
				while (true) {
					counter += 2
					const hue = counter % 10 / 10
					const tweenInfo = new TweenInfo(1, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut);
					const tween = TweenService.Create(part, tweenInfo, { Color: Color3.fromHSV(hue,1,1) });
					tween.Play()
					tween.Completed.Wait()
				}
			})
		});
	}

}