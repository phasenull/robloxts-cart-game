import React from "@rbxts/react"
import { BundleFrame } from "./pages/bundles/bundle-frame"
import { GlitchBundleEntry } from "./pages/bundles/glitch-bundle-entry"
import { MiniBundleEntry } from "./pages/bundles/mini-bundle-entry"
import { TileEntry } from "./tile-entry"
import { Br } from "./br"
import { SoleCartsFrame } from "./pages/carts/sole-carts-frame"
import { SoleCartEntry } from "./pages/carts/sole-cart-entry"
import { A } from "shared/assets"
import { RainbowGradient } from "shared/util.helper"

export function RottenShopList() {
	return (
		<>
			<TileEntry title="Bundles" />
			<BundleFrame>
				<GlitchBundleEntry />
				<MiniBundleEntry side="left" />
				<MiniBundleEntry side="right" />
			</BundleFrame>
			<Br H={.05}/>
			<TileEntry title="Carts" />
			<SoleCartsFrame>
				<SoleCartEntry backgroundImage={A.backgrounds.box_weld} cartName="V8 Cart" description="3x More Speed" />
				<SoleCartEntry backgroundImage={A.backgrounds.box_weld} cartName="Rainbow Cart" description="Rainbow!" textChildren = {<uigradient Color={RainbowGradient()}/>} />
				<SoleCartEntry backgroundImage={A.backgrounds.box_weld} cartName="Spiky Cart" description="Damage others!" />
			</SoleCartsFrame>
			<Br H={.05}/>
		</>
	)
}
