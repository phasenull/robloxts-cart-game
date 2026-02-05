import { Components } from "@flamework/components"
import { Controller, Dependency, OnStart } from "@flamework/core"
import { PlotClientComponent } from "client/components/plot.client.component"
import { Logger } from "shared/logger"
import { ClientEvents } from "shared/network.helper"

@Controller()
export class PlotController implements OnStart {
	constructor(private logger: Logger) {}
	onStart() {
	}
}
