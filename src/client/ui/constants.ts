import { Environment } from "@rbxts/ui-labs"

export const GAMEPAD_BUTTONS = {
	"BRAKE": Enum.KeyCode.ButtonA,
	"HONK": Enum.KeyCode.ButtonB,
	"FLIP": Enum.KeyCode.ButtonY,
	"RESET": Enum.KeyCode.ButtonX,
	"REVIVE": Enum.KeyCode.ButtonA,
	"CONFIRM_RESET": Enum.KeyCode.ButtonY
}
export const MOUSE_KEYBOARD_BUTTONS = {
	"BRAKE": Enum.KeyCode.Space,
	"HONK": Enum.KeyCode.H,
}
export interface IActionKeyMap {
	BRAKE: Enum.KeyCode
	HONK: Enum.KeyCode
	FLIP: Enum.KeyCode
	RESET: Enum.KeyCode
	REVIVE: Enum.KeyCode
	CONFIRM_RESET: Enum.KeyCode
}
export const REVIVE_TIME = 8
export const TESTING_USERS = [
	{
		Name: "Captide",
		UserId: 84798475
	},
	{
		UserId: 261587833,
		Name: "1Svbo"
	},
	{
		Name: "ace3dcg",
		UserId: 2884339769
	},
	{
		Name: "Z_lqify",
		UserId: 1915338622
	},
	{
		Name: "Batin1597",
		UserId: 435570511
	},
	{
		Name: "iEge_Dev",
		UserId: 525766354
	},
	{
		Name: "Kiaxieve",
		UserId: 1196661383
	},
	{
		Name: "cooltayfa",
		UserId: 640984758
	},
	{
		Name: "IdleBrick",
		UserId: 2328163598
	},
	{
		Name: "FireAtacck",
		UserId: 128618486
	},
	{
		Name: "UniquCube",
		UserId: 226930266
	},
	{
		Name: "localModuled",
		UserId: 1214392104
	}
] as Player[]

export function getRandomTestingUser(amount: number): Player[] {
	const picked : Player[] = []
	if (amount >= TESTING_USERS.size()) {
		return TESTING_USERS
	}
	while (picked.size() < amount) {
		const new_picked = TESTING_USERS[math.floor(math.random() * TESTING_USERS.size())]
		if (!picked.includes(new_picked)) {
			picked.push(new_picked)
		}
	}
	return picked
}
export const PRIMARY = new Color3(0.35, 0.69, 1)
export const UIDIM = {
	ONE: new UDim2(1, 0, 1, 0),
	ZERO: new UDim2(0, 0, 0, 0),
	HALF_X: new UDim2(1, 0, 0.5, 0),
	HALF_Y: new UDim2(0.5, 0, 0.5, 0),
	CENTER: new UDim2(0.5, 0, 0.5, 0),
	A_CENTER: new Vector2(0.5, 0.5),
	A_BOTTOM: new Vector2(0.5, 1),
	A_TOP: new Vector2(0.5, 0),
	RIGHT: new UDim2(1, 0, 0.5, 0),
	LEFT: new UDim2(0, 0, 0.5, 0),
	A_LEFT: new Vector2(0, 0.5),
	A_RIGHT: new Vector2(1, 0.5),
	A_TOP_LEFT: new Vector2(0, 0),
	A_TOP_RIGHT: new Vector2(1, 0),
	A_BOTTOM_RIGHT: new Vector2(1, 1),
	A_BOTTOM_LEFT: new Vector2(0, 1),
	TOP_LEFT: new UDim2(0, 0, 0, 0),
	TOP_RIGHT: new UDim2(1, 0, 0, 0),
	TOP_CENTER: new UDim2(0.5, 0, 0, 0),
	BOTTOM_LEFT: new UDim2(0, 0, 1, 0),
	BOTTOM_RIGHT: new UDim2(1, 0, 1, 0),
	BOTTOM_CENTER: new UDim2(0.5, 0, 1, 0)
}
export const __STUDIO__ = !!Environment.PluginWidget
export type GUI_KEYS =
	| "shop"
	| "gift"
	| "party"
	| "settings"
	| "inventory"
	| "index"
	| "plot"
	| (string & {})
