import { Controller, Module } from "@typetorch/framework"
import { type GarageTracks, loadGarageTracks } from "shared/cart.helper"

/** Owns the garage preview's in/out animation tracks for this generation (loaded on first use, destroyed with it). */
@Controller()
export class GarageController extends Module {
	private garage_tracks: GarageTracks | undefined

	tracks(): GarageTracks {
		if (!this.garage_tracks) {
			const tracks = loadGarageTracks()
			this.trove.add(tracks.anim_in)
			this.trove.add(tracks.anim_out)
			this.garage_tracks = tracks
		}
		return this.garage_tracks
	}
}
