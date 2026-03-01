import { Controller, OnStart } from "@flamework/core"
import { Logger } from "@common/shared/logger"
import React, { StrictMode } from "@rbxts/react"
import { createPortal, createRoot } from "@rbxts/react-roblox"
import { Players,StarterPlayer } from "@rbxts/services"
import { App } from "client/ui/App"
import { promptGroupJoin } from "client/group-prompt"

const GROUP_PROMPT_INTERVAL = 180 // seconds

@Controller()
export class UIController implements OnStart {
	constructor(private logger: Logger) {}
	onStart(): void {
        StarterPlayer.DevTouchMovementMode = Enum.DevTouchMovementMode.Thumbpad

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

		task.spawn(() => {
			task.wait(60)
			while (true) {
				promptGroupJoin()
				task.wait(GROUP_PROMPT_INTERVAL)
			}
		})
	}
}
