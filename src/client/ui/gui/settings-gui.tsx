import React from "@rbxts/react";

import { A } from "shared/assets";
import { PRIMARY, UIDIM } from "../constants";
export function SettingsGui() {
	return (
		<imagelabel
			Size={UIDIM.ONE}
			AnchorPoint={UIDIM.A_CENTER}
			Position={UIDIM.CENTER}
			ScaleType={Enum.ScaleType.Crop}
			Image={A.ui.waves4}
			BackgroundColor3={PRIMARY}
			ImageTransparency={0.6}
		>
			<uicorner CornerRadius={new UDim(0.1, 0)} />
		</imagelabel>
	);
}
