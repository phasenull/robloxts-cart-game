import { BaseComponent, Component } from "@flamework/components"
import { OnStart } from "@flamework/core"
import Object from "@rbxts/object-utils"
import { Players } from "@rbxts/services"
import Signal from "@rbxts/signal"
import { plot_assets } from "shared/assets"
import {
	DEFAULT_PLOT_DATA,
	PlotSharedComponent
} from "shared/components/plot.shared.component"
import { Logger } from "shared/logger"
import { ClientEvents, ClientFunctions } from "shared/network.helper"
import { PlotProps, PlotData, PropType } from "shared/plot-state"
import { findPropFromDescriptorAndType } from "shared/util.helper"
@Component({ tag: "PlotComponent" })
export class PlotClientComponent
	extends PlotSharedComponent
	implements OnStart
{
	public readonly onReplicated = new Signal<(hint: keyof PlotData) => void>()
	onStart(): void {
		ClientFunctions.PlotService.requestPlotReplication
			.invokeWithTimeout(5000, this.instance.Name)
			.andThen((data) => {
				this.__process_replication(data, "full")
			})
			.catch((reason) => {
				this.logger.log(
					`Failed to request plot replication for plot ${this.instance.Name}: ${reason}`
				)
			})
		ClientEvents.PlotService.replicate.connect((guid, data, hint) => {
			if (this.instance.Name !== guid) return
			this.logger.log(`Received replication for plot ${guid} with hint ${hint}`)
			this.__process_replication(data, hint)
		})

		this.onReplicated.Connect((hint) => {
			this.logger.log(`Processing replication hint: ${hint}`)
			if (hint === "props") {
				this.logger.log(`Replicating plot props:`)
				print(this.data?.props)
				this.refreshProps()
			}
			if (hint === "owner_id") {
				const owner = this.getOwnerPlayer()
				this.logger.log(
					`Plot owner updated: ${owner?.Name} (UserId: ${owner?.UserId})`
				)
			}
		})
	}
	private readonly builds = new Instance("Folder")
	constructor() {
		super(new Logger(`plot.client.component`))
		this.builds.Name = "builds"
		this.builds.Parent = this.instance
	}
	refreshProps() {
		if (!this.data) return
		const owner = this.getOwnerPlayer()
		if (!owner) {
			this.cleanup()
			return
		}
		const entries = Object.entries(this.data.props)
		entries.forEach(([prop_type, _]) => {
			this.handlePropTypeReplication(prop_type as PropType)
		})
	}
	private __process_replication<T extends PlotData|undefined>(
		data: T,
		hint: keyof PlotData | "full"
	) {
		if (!data) {
			this.cleanup()
			return
		}
		this.data = data
		if (hint === "full") {
			const keys = ["owner_id","floors","props"] as (keyof PlotData)[]
			for (const key of keys) {
				this.logger.log(`Firing replication for key: ${key}`)
				this.onReplicated.Fire(key)
			}
		} else {
			this.onReplicated.Fire(hint)
		}
	}
	handlePropTypeReplication(prop_type: PropType) {
		if (!this.data) return
		const new_environment = this.data.props[prop_type]
		const old_instance = this.getPropInstanceFromType(prop_type)
		const old_descriptor = old_instance?.Descriptor.Value
		if (old_descriptor === new_environment) {
			return
		}
		if (old_descriptor) {
			const old_config = findPropFromDescriptorAndType(
				old_descriptor,
				prop_type
			)
			const cleanup = old_config?.cleanup
			if (cleanup) {
				cleanup(this)
			}
		}
		old_instance?.Destroy()
		if (!new_environment) {
			return
		}
		const config = findPropFromDescriptorAndType(new_environment, prop_type)
		const handler = config?.handler
		let new_instance
		if (handler) {
			new_instance = handler?.(this)
		} else {
			new_instance = config?.model.Clone()
			new_instance?.PivotTo(this.instance.GetPivot())
		}
		assert(new_instance, `Prop model for ${new_environment} not found`)
		new_instance.Parent = this.builds
		if (new_instance) {
			new_instance.Name = prop_type
			const descriptor_value = new Instance("StringValue")
			descriptor_value.Name = "Descriptor"
			descriptor_value.Value = new_environment
			descriptor_value.Parent = new_instance
			new_instance.Parent = this.builds
		}
	}
	getPropInstanceFromType<T extends keyof PlotProps>(prop_type: T) {
		return this.builds
			.GetChildren()
			.find((child) => child.Name === prop_type) as
			| undefined
			| (Instance & { Descriptor: StringValue & { Value: T } })
	}
	cleanup() {
		this.builds.ClearAllChildren()
		if (!this.data) return
		this.logger.log(`Cleaning up plot of owner ID: ${this.data?.owner_id}`)
		this.data = undefined
	}
}
