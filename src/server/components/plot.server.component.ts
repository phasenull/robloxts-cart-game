import { BaseComponent, Component } from "@flamework/components"
import { Dependency, OnStart } from "@flamework/core"
import { deepCopy } from "@rbxts/object-utils"
import { HttpService, Players } from "@rbxts/services"
import Signal from "@rbxts/signal"
import { DataService } from "server/services/data.service"
import { plot_assets, plots } from "shared/assets"
import {
	DEFAULT_PLOT_DATA,
	PlotSharedComponent
} from "shared/components/plot.shared.component"
import { Logger } from "shared/logger"
import { ServerEvents } from "shared/network.helper"
import { PlotProps, PlotData, PlotDescriptor } from "shared/plot-state"
import { ProperReturns } from "shared/type.helper"

@Component({ tag: "PlotComponent" })
export class PlotServerComponent extends PlotSharedComponent {
	public readonly guid: string = HttpService.GenerateGUID(false)
	constructor() {
		super(new Logger("plot.server.component"))
		// this.logger.log(`Creating new plot (${this.instance.Name}) with GUID: ${this.guid}`)
		const root = this.instance.FindFirstChild("Root")
		assert(root && root.IsA("BasePart"), "Plot model is missing a Root part")
		this.instance.Name = this.guid
		root.Transparency = 1
		root.CanCollide = false
	}

	cleanup() {
		const owner = this.getOwnerPlayer()
		this.logger.log(
			`Cleaning up plot of ${owner?.Name} (UserId: ${owner?.UserId})`
		)
		this.setOwner(undefined)
	}
	setOwner(owner_id?: number) {
		if (owner_id) {
			const [success, err] = this.loadData(owner_id)
			if (!success || err) {
				const owner = this.getOwnerPlayer()
				owner?.Kick(`Error loading your plot data: ${err}`)
			}
		} else {
			this.__replicate_state("full")
		}
	}
	setProp<T extends keyof PlotProps, D extends PlotDescriptor<T>>(
		prop_type: T,
		descriptor: D
	) {
		if (!this.data) {
			this.cleanup()
			return
		}
		this.logger.log(
			`Setting prop of type ${prop_type} to descriptor ${descriptor}`
		)
		if (descriptor === this.data.props[prop_type]) {
			return
		}
		this.data.props[prop_type] = descriptor
		this.__replicate_state("props")
	}
	loadData(owner_id?: number): ProperReturns<true> {
		if (!owner_id) {
			this.data = undefined
			this.__replicate_state("full")
			return [false, "No owner ID provided"]
		}
		const owner = Players.GetPlayerByUserId(owner_id)
		if (!owner) return [false, "No owner player found"]
		const data_service = Dependency<DataService>()
		const player_profile = data_service.getProfile(owner)
		if (!player_profile) return [false, "No player profile found"]
		const plot_data = deepCopy(player_profile.Data.plot)
		if (!plot_data) return [false, "No plot data found"]
		player_profile.Data.plot.owner_id = owner.UserId
		this.data = player_profile.Data.plot
		this.data.owner_id = owner_id
		this.__replicate_state("full")
		return [true]
	}
	private __replicate_state(hint: keyof PlotData | "full") {
		ServerEvents.PlotService.replicate.broadcast(this.guid, this.data, hint)
	}
}
