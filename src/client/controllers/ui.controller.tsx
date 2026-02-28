import { Controller, OnStart } from "@flamework/core"
import { Logger } from "@common/shared/logger"
import React, { StrictMode } from "@rbxts/react"
import { createPortal, createRoot } from "@rbxts/react-roblox"
import { GroupService, Players } from "@rbxts/services"
import { App } from "client/ui/App"

const GROUP_ID = 1059580522
const GROUP_PROMPT_INTERVAL = 5 * 60 // 5 minutes in seconds

@Controller()
export class UIController implements OnStart {
	constructor(private logger: Logger) {}
	onStart(): void {
		const root = createRoot(new Instance("Folder"))
		const player_gui = Players.LocalPlayer.FindFirstChildOfClass("PlayerGui")
		assert(player_gui, "PlayerGui not found")
		const screen_gui = new Instance("ScreenGui")
		screen_gui.ResetOnSpawn = false
		screen_gui.Name = "root"
		screen_gui.IgnoreGuiInset = true
		screen_gui.Parent = player_gui
		screen_gui.DisplayOrder = 5
		screen_gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

		root.render(<StrictMode>{createPortal(<App />, screen_gui)}</StrictMode>)

		const local_player = Players.LocalPlayer
		const promptIfNotMember = () => {
			if (!local_player.IsInGroup(GROUP_ID)) {
				GroupService.PromptJoinAsync(GROUP_ID)
			}
		}
		promptIfNotMember()
		task.spawn(() => {
			while (true) {
				task.wait(GROUP_PROMPT_INTERVAL)
				promptIfNotMember()
			}
		})
	}
}
