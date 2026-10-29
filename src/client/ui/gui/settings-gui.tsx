import React from "@rbxts/react";

import { A } from "shared/common/assets";
import { PRIMARY,
UIDIM } from "client/common/ui/constants";
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
