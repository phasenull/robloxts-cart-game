import React from "@rbxts/react"
import { BundleFrame } from "./pages/bundles/bundle-frame"
import { GlitchBundleEntry } from "./pages/bundles/glitch-bundle-entry"
import { MiniBundleEntry } from "./pages/bundles/mini-bundle-entry"


export function RottenShopList() {
	return <>
		<BundleFrame>
			<GlitchBundleEntry/>
			<MiniBundleEntry side="left"/>
			<MiniBundleEntry side="right"/>
		</BundleFrame>
	</>
}