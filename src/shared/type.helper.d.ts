
export type IConfig = {
	CartConfig: ICartConfig
	PurchasableConfig: IPurchasableConfig
}
export type INotification = {
	title: string
	description: string
	duration?: number
	soundId?: string
}
export type IPurchasableConfig = IPurchasable[]

export type IPurchasable = {
	// descriptor:string,
	// gamepass_id: T extends "gamepass" ? number : never;
	product_id: number
	rewards: IReward<any>[]
}

export type IDescriptableReward = "cart" | "lucky_block" | "honk"
export type IValuableReward =
	| "cash"
	| "revives"
	| "flips"
	| "skip_island"
	| "unlock_island"
export type IRewardType = IDescriptableReward | IValuableReward | "custom"
export type IReward<T extends IRewardType> = {
	type: T
	value: T extends IValuableReward ? number : string
	handler: T extends "custom" ? (player: Player) => void : undefined
}
export type ICartConfig = ICartEntry[]
export type ICartEntry= {
	name: string
	friction: number
	power: number
	product_id?: number
	price?: number

}
export type Party = {
	players: Array<Player>
	owner: Player
	guid: string
	is_public: boolean
	invites: Array<Player>
	state: "lobby" | "playing"
	max_players: number
}
export type ButtonModel = Model & {
	["Spawn Button"]: Model
	["SpawnPlatform"]: Model
}
export type ICart = Model & {
	VehicleSeat: VehicleSeat
	Root: Part & {
		Root: Attachment
		Drive: Attachment
		DriveForce: VectorForce
		SteerTorque: Torque
		Upright: AlignOrientation
	}
	Brake: ParticleEmitter
	Wheels: Model
}

export type IWheel = Model & {
	WHEEL: BasePart
	CONNECTION: BasePart & {
		Caster: Motor6D
	}
	BALL: Part
}
export type IShopConfig = Record<IShopItemTypes, IShopItem[]>
export type IShopItem = {
	name: string
	price?: number
	product_id?: number
}
export type IShopItemTypes = "cart" | "honk"
export type IInventoryData = {
	carts?: ICartEntry[]
	[key: string]: any
}
