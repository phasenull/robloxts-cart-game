import { TweenService } from "@rbxts/services"
import { TaggedComponent } from "shared/component"

/** Tag "RGBComponent" (Model): cycles every part's colour through the hue wheel. */
export class RgbComponent extends TaggedComponent<Model> {
	private readonly parts: BasePart[] = []
	onStart(): void {
		// if (this.instance.Parent === Workspace) {
		// 	task.wait(0.05);
		// }
		task.wait(0.3)
		this.instance.GetDescendants().forEach((descendant) => {
			if (descendant.IsA("BasePart")) {
				this.parts.push(descendant)
			}
		})
		this.parts.forEach((part) => {
			let tween: Tween | undefined
			this.trove.add(() => tween?.Cancel())
			this.trove.add(task.spawn(() => {
					let counter = 0
					part.Color = Color3.fromHSV(0, 1, 1)
					while (true) {
						counter += 2
						const hue = (counter % 10) / 10
						const tweenInfo = new TweenInfo(1, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut)
						tween = TweenService.Create(part, tweenInfo, {
							Color: Color3.fromHSV(hue, 1, 1),
						})
						tween.Play()
						tween.Completed.Wait()
					}
				}),
			)
		})
	}
}
