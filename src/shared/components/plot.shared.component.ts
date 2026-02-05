import { BaseComponent, Component } from "@flamework/components"
import { OnStart } from "@flamework/core"
import Object from "@rbxts/object-utils"
import { Players } from "@rbxts/services"
import Signal from "@rbxts/signal"
import { assets, plot_assets } from "shared/assets"
import { __IS_CLIENT__, __IS_SERVER__ } from "shared/config.helper"
import { Logger } from "shared/logger"
import { ClientEvents, ClientFunctions } from "shared/network.helper"
import { PlotData } from "shared/plot-state"
export const DEFAULT_PLOT_DATA: PlotData = {
	props: {
		Capsule: undefined,
		Decoration: undefined,
		Furniture: undefined,
		Environment: "Default"
	},
	owner_id: undefined,
	floors: []
}
@Component({ tag: "PlotComponent" })
export class PlotSharedComponent
	extends BaseComponent<{}, Model>
{
	protected data: PlotData | undefined = undefined
	// Shared logic for plot components can be added here
	constructor(protected logger: Logger) {
		super()
	}
	getData(): PlotData | undefined {
		return this.data
	}
	getGUID(): string {
		return this.instance.Name
	}
	getOwnerId(): number | undefined {
		return this.data?.owner_id
	}
	getOwnerPlayer(): Player | undefined {
		if (!this.data?.owner_id) return undefined
		return Players.GetPlayerByUserId(this.data.owner_id)
	}
	getPivot() {
		return this.instance.GetPivot()
	}

}
