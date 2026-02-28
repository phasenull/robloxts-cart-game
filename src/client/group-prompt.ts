import { GroupService } from "@rbxts/services"

const GROUP_ID = 1059580522
const DEBOUNCE_DURATION = 180 // seconds

// Initialize so the first prompt can't fire until DEBOUNCE_DURATION seconds after module load
let last_prompted = os.clock()

export function promptGroupJoin() {
	const now = os.clock()
	if (now - last_prompted < DEBOUNCE_DURATION) return
	last_prompted = now
	task.spawn(() => GroupService.PromptJoinAsync(GROUP_ID))
}
