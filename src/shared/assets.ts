import { Components } from "@flamework/components";
import { Dependency } from "@flamework/core";
import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { log_base } from "./type.helper";

export namespace A {
	export const icons = {
		warning: "rbxassetid://74839640372914",
		gift: "rbxassetid://138281590164953",
		cart: "rbxassetid://119456315591520",
		settings: "rbxassetid://74336083648182",
		codes: "rbxassetid://89518385722376",
		cross: "rbxassetid://124567946980554",
		checkmark: "rbxassetid://122249290619745",
		diamond: "rbxassetid://81861227352326",
		plus: "rbxassetid://123582775125623",
		minus: "rbxassetid://140451181017162",
		mouse: "rbxassetid://132805255643999",
		click: "rbxassetid://71181711844709",
		spinwheel: "rbxassetid://120789727909515",
		coin: "rbxassetid://106816844644989",
		luck: "rbxassetid://92534008789861",
		trade: "rbxassetid://104326444532727",
		rebirth: "rbxassetid://121185824614656",
		backpack: "rbxassetid://120361956794366",
		hammer: "rbxassetid://135491521827812",
		ace: {
			shop: "rbxassetid://137901908005067",
			clover: "rbxassetid://82529853756707",
			rebirth_green: "rbxassetid://82260899147277",
			leaderboard : "rbxassetid://108990632074249",
		}
	};
	export const ui = {
		loading_indicator_white: "rbxassetid://106340732495073",
		sparkle: "rbxassetid://89147208696467",
		sparkle2: "rbxassetid://139671321949199",
		sunburst: "rbxassetid://117443341285172",
		halftone6: "rbxassetid://99220335090752",
		white_corner_halftone: "rbxassetid://137680371636630",
		waves: "rbxassetid://123150634112653",
		waves2: "rbxassetid://137621627804504",
		waves3: "rbxassetid://111321238230359",
		waves4: "rbxassetid://86850482090066",
		cloudy_sparkle: "rbxassetid://83030473823236",
		halo: "rbxassetid://113844016565006",
		halo_gradient: "rbxassetid://73489942530226",
		superhero_star: "rbxassetid://105306721592750",
		halftone_arrow_left: "rbxassetid://97118495441125",
		three_sparkles_halftone: "rbxassetid://107261394369935",
		sparkles_cluster: "rbxassetid://119036603409680",
		sunburst_sparkles: "rbxassetid://135532808947822",
		rays: "rbxassetid://73467110937491",
		checkboard: "rbxassetid://130796317274616",
		weld: "rbxassetid://133006769235040",
		checkboard2x2: "rbxassetid://132475668726463",
		stud: "rbxassetid://117364829478409",
		corner: "rbxassetid://137208564577695",
		background_blur: "rbxassetid://82404922123022",
		frame: "rbxassetid://120384921811889",
		button_horizontal_bright: "rbxassetid://83483836238902",
		button_horizontal: "rbxassetid://132165141342743",
		player_profile_dashes: "rbxassetid://86401748109465",
		halftone_bottom_top: "rbxassetid://110100323318280",
		halftone_circle: "rbxassetid://124284820217674",
		tile: "rbxassetid://120250412681646",
		inner_shadow: "rbxassetid://75600902046326",
		ellipse: "rbxassetid://113978818477114",
		keys: {
			h: "rbxassetid://99753543559272",
			empty: "rbxassetid://137837563740597",
			space: "rbxassetid://140163882410345",
		},
	};
	export const backgrounds = {
		post_magma: "rbxassetid://89145592620126",
		initial: "rbxassetid://115272068924901",
		post_initial: "rbxassetid://122225957336369",
		post_snowy: "rbxassetid://93762869405076",
		box_weld: "rbxassetid://94748745460410",
	};
	export const sounds = {
		click_hard: "rbxassetid://6324790483",
		click_soft: "rbxassetid://15675059323",
		pop: "rbxassetid://88442833509532",
		error: "rbxassetid://550209561",
		pop_success: "rbxassetid://106145041472451",
		mission_success: "rbxassetid://111224610455554",
		purchase_success: "rbxassetid://134952684776633",
		mango_scream: "rbxassetid://15798534597",
		pizza_scream: "rbxassetid://154157563",
		tom_scream: "rbxassetid://139694892021582",
		drift: "rbxassetid://71308996451354",
		party: "rbxassetid://5759274072",
		click_kaan: "rbxassetid://876939830",
		cash_kaan: "rbxassetid://134952684776633",
		reward_earned: "rbxassetid://4612375802",
	};
}
export const assets = ReplicatedStorage.FindFirstChild("assets") as Folder & {
	log_base: log_base;
	carts: Folder;
	honks: Folder;
	CheckpointVisuals: Model & { checkpoint_visual: Part };
	PointArrow: BasePart;
	Speedlines: Model & {
		Lines: Part & {
			Attachment: Attachment & {
				ParticleEmitter: ParticleEmitter;
			};
		};
	};
};
export const scriptables = Workspace.FindFirstChild("scriptables") as Folder;
export const runtime = scriptables?.FindFirstChild("runtime") as Folder;
