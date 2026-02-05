import { Components } from "@flamework/components"
import { Dependency, OnStart, Service } from "@flamework/core"
import { Players } from "@rbxts/services"
import { PlotServerComponent } from "server/components/plot.server.component"
import {
	plots,
	plot_assets,
	runtime,
	plot_locations,
	assets
} from "shared/assets"
import { DEFAULT_PLOT_DATA } from "shared/components/plot.shared.component"
import { Logger } from "shared/logger"
import {
	ClientFunctions,
	ServerEvents,
	ServerFunctions
} from "shared/network.helper"
import { DataService } from "./data.service"
import { PlotData } from "shared/plot-state"
import Object from "@rbxts/object-utils"
import { validatePlotPropsConfig } from "shared/configs/plot-props"

@Service({ loadOrder: 2 })
export class PlotService implements OnStart {
	constructor(
		private logger: Logger,
		private DataService: DataService
	) {}
	onStart(): void {
		validatePlotPropsConfig()
		const components = Dependency<Components>()
		plot_locations.GetChildren().forEach((part, index) => {
			const plot_model = assets.FindFirstChild("plot") as Model | undefined
			assert(plot_model, "Plot model not found in assets")
			const plot_instance = plot_model.Clone()
			plot_instance.Name = `Plot_${index + 1}`
			plot_instance.Parent = plots
			plot_instance.PivotTo((part as Part).GetPivot())
			part.Destroy()
		})
		plot_locations.Destroy()

		Players.PlayerAdded.Connect((player) => {
			const player_data = this.DataService.getProfile(player)
			if (!player_data) {
				this.DataService.subscribePlayerDataLoaded(player).Wait()
			}
			this.addPlayerPlot(player)
			player.CharacterAdded.Connect((char) => {
				const plot = this.getPlayerPlot(player)
				if (!plot) {
					this.logger.warn(
						`No plot found for player ${player.Name} on character spawn`
					)
					return
				}
				char.PivotTo(plot.getPivot().mul(new CFrame(0, 5, 0)))
			})
		})
		Players.PlayerRemoving.Connect((player) => {
			const plot = this.getPlayerPlot(player)
			if (!plot) {
				this.logger.warn(
					`No plot found for player ${player.Name} on player removal`
				)
				return
			}
			plot.cleanup()
		})
		assert(plots, "Plots folder not found in scriptables")
		assert(plot_assets, "Plot assets folder not found in assets")
		assert(
			plot_assets.FindFirstChild("Default"),
			`Default plot model not found in plot assets`
		)
		ServerFunctions.PlotService.requestPlotReplication.setCallback(
			(player, guid: string) => {
				const plot = components
					.getAllComponents<PlotServerComponent>()
					.find((plot) => plot.instance.Name === guid)
				if (!plot) {
					this.logger.warn(
						`Player ${player.Name} requested replication for unknown plot GUID: ${guid}`
					)
					return DEFAULT_PLOT_DATA
				}
				return plot.getData() // Accessing protected member
			}
		)
		task.delay(0.1, () => {
			this.logger.log(
				`PlotService started with ${this.getPlots().size()}/${plots.GetChildren().size()} plots available`
			)
		})
	}
	getPlots() {
		const components = Dependency<Components>()
		return components.getAllComponents<PlotServerComponent>()
	}

	getPlayerPlot(player: Player): PlotServerComponent | undefined {
		return this.getPlots().find((plot) => plot.getOwnerId() === player.UserId)
	}
	addPlayerPlot(player: Player): PlotServerComponent | undefined {
		const plot = this.findAvailablePlot()
		if (!plot) {
			this.logger.warn(`No available plots for player ${player.Name}`)
			return undefined
		}
		plot.setOwner(player.UserId)
		this.logger.log(
			`Assigned plot ${plot.instance.GetFullName()} to player ${player.Name}`
		)
		const owner = plot.getOwnerPlayer()
		if (owner) {
			const char = owner.Character
			if (char) {
				char.PivotTo(plot.getPivot().mul(new CFrame(0, 5, 0)))
			}
		}
		plot.setProp("Environment", "Default")
		return plot
	}
	findAvailablePlot(): PlotServerComponent | undefined {
		const plot = this.getPlots().find((plot) => {
			return plot.getOwnerId() === undefined
		})
		return plot
	}
}
