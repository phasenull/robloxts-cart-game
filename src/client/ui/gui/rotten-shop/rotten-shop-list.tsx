import React from "@rbxts/react";
import { BundleFrame } from "./pages/bundles/bundle-frame";
import { GlitchBundleEntry } from "./pages/bundles/glitch-bundle-entry";
import { MiniBundleEntry } from "./pages/bundles/mini-bundle-entry";
import { TileEntry } from "./tile-entry";
import { Br } from "./br";
import { SoleCartsFrame } from "./pages/carts/sole-carts-frame";
import { SoleCartEntry } from "./pages/carts/sole-cart-entry";
import { A } from "@common/shared/assets";
import { RainbowGradient } from "@common/shared/util.helper";
import { CurrenciesFrame } from "./pages/currencies/currencies-frame";
import { CurrencyEntry } from "./pages/currencies/currency-entry";

export function RottenShopList() {
	return (
		<>
			<TileEntry title="Bundles" />
			<BundleFrame>
				<GlitchBundleEntry productId={3535531305} cartName="Hacker Cart" />
				<MiniBundleEntry productId={3535475003} cartName="Rainbow Cart" side="left" />
				<MiniBundleEntry  productId={3535475079} cartName="Frozen Cart" side="right" />
			</BundleFrame>
			<Br H={0.05} />
			<TileEntry title="Carts" />
			<SoleCartsFrame>
				<SoleCartEntry
					backgroundImage={A.backgrounds.box_weld}
					cartName="Ultra Fast Cart"
					description="Gotta go fast!"
				/>
				<SoleCartEntry
					backgroundImage={A.backgrounds.box_weld}
					cartName="Armored Cart"
					description="Become invincible!"
					// textChildren={<uigradient Color={RainbowGradient()} />}
				/>
				<SoleCartEntry
					backgroundImage={A.backgrounds.box_weld}
					cartName="Spiky Cart"
					description="Damage others!"
				/>
			</SoleCartsFrame>
			<Br H={0.05} />
			<TileEntry title="Utilities" />
			<CurrenciesFrame>
				<CurrencyEntry productId={3540755388} />
				<CurrencyEntry productId={3540755332} />
				<CurrencyEntry productId={3535705767} />
				<CurrencyEntry productId={3534759926} />
				<CurrencyEntry productId={3534758322} />
				<CurrencyEntry productId={3535708292} />
			</CurrenciesFrame>
			<Br H={0.2} />
		</>
	);
}
