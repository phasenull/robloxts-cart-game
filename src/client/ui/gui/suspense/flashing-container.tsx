import React from "@rbxts/react";
import { UIDIM } from "client/ui/constants";
import useAnimateValue from "client/ui/hooks/useAnimateValue";
import { RainbowGradient } from "shared/util.helper";

export function FlashingContainer() {
	const original_color = Color3.fromRGB(36, 37, 43);
	const color_value = useAnimateValue({
		target_value: 1,
		tween_info: new TweenInfo(
			1,
			Enum.EasingStyle.Linear,
			Enum.EasingDirection.InOut,
			-1,
		),
	});
	// const target_color = original_color.Lerp(new Color3(1, 1, 1), color_value);
	return (
		<frame
        // original 460, 246
			Size={UDim2.fromOffset(465, 250)}
			AnchorPoint={UIDIM.A_CENTER}
			Position={UIDIM.CENTER}
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
		>
			<uicorner CornerRadius={new UDim(0, 16)} />
            <uigradient
                Color={RainbowGradient()}
                Rotation={color_value * 360}
            />
        </frame>
    );
}
