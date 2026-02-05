export type ProperReturns<T> = [T] | [false, string]
export type MovementDirection = 1 | -1 | 0
export type log_base = Model & {
	Hitbox: Part & {
		left_char: Attachment
		right_char: Attachment
	}
	Align: Model & {}
	// Visuals: Model
	// Align:Part & {
	// 	LeftSeat:Seat
	// 	RightSeat:Seat
	// }
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

export type ICart = Model & {
	FL_Ball: Part & {}
	VehicleSeat: Seat & {
		WeldConstraint: WeldConstraint
	}
	Root: Part & {
		RL_ATT: Attachment
		RR_ATT: Attachment
		FR_ATT: Attachment
		Root: Attachment
		FL_ATT: Attachment
		VectorForce: VectorForce
	}
	Brake:ParticleEmitter
	RR_Ball: Part & {}
	FR_Ball: Part & {}
	RL_Ball: Part & {}
}
