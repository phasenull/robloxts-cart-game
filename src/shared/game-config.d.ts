export interface GameConfig {
	"universe_id": number,
	"place_id": number,
	"gamepasses": {
		"vip_gamepass": number
	},
	"products": {
		"starter_pack": number
	},
	"game_type": "dont_wake_the",
	"config": {
		"plots_enabled": boolean,
		"dont_wake_the_boss_enabled": boolean,
		"entity_spawning_enabled": boolean,
		"lucky_blocks_enabled": boolean,
		"entity_spawning_type": "multi_region" | "single_region",
	},
	"services": string[],
	"controllers": string[],
	"components": string[]
}