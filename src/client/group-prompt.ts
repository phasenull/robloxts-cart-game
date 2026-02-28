import { GroupService } from "@rbxts/services"

const GROUP_ID = 1059580522
const DEBOUNCE_DURATION = 180 // seconds

let last_prompted = -DEBOUNCE_DURATION

export function promptGroupJoin() {
	const now = os.clock()
	if (now - last_prompted < DEBOUNCE_DURATION) return
	last_prompted = now
	task.spawn(() => GroupService.PromptJoinAsync(GROUP_ID))
}
