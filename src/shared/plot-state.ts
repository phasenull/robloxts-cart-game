export type PlotData = {
	props: PlotProps
	owner_id: number | undefined
	floors: {
		level: number
		created_at: number
		capsules: {
			key: number
			thing_guid: string
			cash_earned: number
			last_collected_at: number
		}[]
	}[]
}
export type ThingData = {
	guid: string
	level: number
	descriptor: string
}
export const VALID_PROP_TYPES = ["Environment", "Furniture", "Decoration","Capsule"] as const
export type PropType = typeof VALID_PROP_TYPES[number]
export type PlotProps = Record<Partial<PropType>,string|undefined>
import type { PlotClientComponent } from "client/components/plot.client.component"
import { PLOT_PROPS_CONFIG } from "./configs/plot-props"
export type PlotPropConfig = {
	model:Model,
	descriptor:string,
	handler?:(component:PlotClientComponent)=>void
	cleanup?:(component:PlotClientComponent)=>void
}
export type PlotDescriptor<T extends PropType> = typeof PLOT_PROPS_CONFIG[T][number]["descriptor"]
