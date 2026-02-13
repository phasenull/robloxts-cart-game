export type ProperReturns<T> = [T] | [false, string];
export type MovementDirection = 1 | -1 | 0;
export type log_base = Model & {
	Hitbox: Part & {
		left_char: Attachment;
		right_char: Attachment;
	};
	Align: Model & {};
	// Visuals: Model
	// Align:Part & {
	// 	LeftSeat:Seat
	// 	RightSeat:Seat
	// }
};

export type IConfig = {
	CartConfig: ICartConfig;
	PurchasableConfig: IPurchasableConfig;
	ShopConfig: IShopConfig;
};
export type INotification = {
	title: string;
	description: string;
	duration?: number;
	soundId?: string;
}
export type IPurchasableConfig = IPurchasable[]


export type IPurchasable = {
	// descriptor:string,
	// gamepass_id: T extends "gamepass" ? number : never;
	product_id: number;
	rewards: IReward<any>[];
};

export type IDescriptableReward = "cart" | "lucky_block";
export type IValuableReward = "cash" | "revives" | "flips" | "skip_island";
export type IRewardType = IDescriptableReward | IValuableReward | "custom";
export type IReward<
	T extends IRewardType
> = {
	type: T;
	descriptor: T extends IDescriptableReward ? string : never;
	value: T extends IValuableReward ? number : never;
	handler: T extends "custom" ? (player: Player) => void : undefined;
};
export type ICartConfig = ICartEntry[];
export type ICartEntry = {
	name: string;
	friction: number;
	max_velocity: number;
	power: number;
} & ({ gamepass_id: number } | { price: number });
export type Party = {
	players: Array<Player>;
	owner: Player;
	guid: string;
	is_public: boolean;
	invites: Array<Player>;
	state: "lobby" | "playing";
	max_players: number;
};
export type ButtonModel = Model & {
	["Spawn Button"]: Model;
	["SpawnPlatform"]: Model;
};
export type ICart = Model & {
	VehicleSeat: Seat & {
		WeldConstraint: WeldConstraint;
	};
	Root: Part & {
		RL_ATT: Attachment;
		RR_ATT: Attachment;
		FR_ATT: Attachment;
		Root: Attachment;
		FL_ATT: Attachment;
		VectorForce: VectorForce;
	};
	Brake: ParticleEmitter;
	Wheels: Model & {
		FL: IWheel;
		FR: IWheel;
		RL: IWheel;
		RR: IWheel;
	};
};

export type IWheel = Model & {
	WHEEL: Part & {
		WeldConstraint: WeldConstraint;
	};
	CONNECTION: Part & {
		Attachment: Attachment;
		HingeConstraint: HingeConstraint;
	};
	BALL: Part & {
		BallSocketConstraint: BallSocketConstraint;
		Attachment: Attachment;
	};
};
export type IShopConfig = Record<IShopItemTypes, IShopItem[]>
export type IShopItem = {
	name:string,
	price:number,
}
export type IShopItemTypes = "cart" | "honk" | "flips" | "revives" | (string & {})