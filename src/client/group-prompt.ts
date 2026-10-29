import { GroupService } from "@rbxts/services"
import { TypeTorch } from "@typetorch/framework"

const GROUP_ID = 1059580522
const DEBOUNCE_DURATION = 180 // seconds

/** Kept across swaps (plain data). The UI controller opens it at start, so the first prompt can't fire until DEBOUNCE_DURATION after that. */
export function groupPromptState() {
	return TypeTorch.persist("group.prompt.v1", () => ({ last_prompted: os.clock() }))
}

export function promptGroupJoin() {
	const state = groupPromptState()
	const now = os.clock()
	if (now - state.last_prompted < DEBOUNCE_DURATION) return
	state.last_prompted = now
	// task.spawn(() => GroupService.PromptJoinAsync(GROUP_ID))
}
