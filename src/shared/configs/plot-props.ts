import Object from "@rbxts/object-utils"
import { t } from "@rbxts/t"
import { assets, plot_assets } from "shared/assets"
import { PlotPropConfig, PropType } from "shared/plot-state"

export const PLOT_PROPS_CONFIG = {
	Environment: [
		{
			model: plot_assets.FindFirstChild("Default") as Model,
			descriptor: "Default"
		},
		{
			model: plot_assets.FindFirstChild("Desert") as Model,
			descriptor: "Desert"
		}
	],
	Capsule: [],
	Furniture: [],
	Decoration: []
} as Record<PropType, Array<PlotPropConfig>>

export function validatePlotPropsConfig() {
	const validator = t.strictInterface({
		model: t.instanceIsA("Model"),
		descriptor: t.string,
		handler: t.optional(t.callback),
		cleanup: t.optional(t.callback)
	})
	for (const prop_type of Object.keys(PLOT_PROPS_CONFIG) as PropType[]) {
		const configs = PLOT_PROPS_CONFIG[prop_type]
		configs.forEach((e) => {
			assert(
				validator(e),
				`Invalid plot props config for prop type ${prop_type}`
			)
		})
	}
}
