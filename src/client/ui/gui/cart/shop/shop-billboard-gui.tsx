import React, { ReactNode } from "@rbxts/react";
import { GoofyText } from "client/ui/components/goofy-text";
import { ProgressBarComponent } from "client/ui/components/progressbar-component";
import { UIDIM } from "client/ui/constants";
import useAnimateValue from "client/ui/hooks/useAnimateValue";

export function ShopBillboardGui(props: {
	target_instance: PVInstance;
	text: string;
	progress: number;
}) {
	const target_instance = props.target_instance;
	if (!target_instance) return;
	const instance_to_descriptor =
		target_instance.Name === "FR" ? "Wheels" : "Handbrake";
	const RL_CONFIG = {
		Wheels: -1,
		Horn: 1,
		Handbrake: -1,
	};
	const CONFIG = RL_CONFIG[instance_to_descriptor];
	const animated_value = useAnimateValue({
		target_value: 1,
		tween_info: new TweenInfo(
			0.5,
			Enum.EasingStyle.Linear,
			Enum.EasingDirection.InOut,
			0,
			false,
			1,
		),
	});
	const progress = props.progress;
	return (
		<billboardgui
			AlwaysOnTop
			Size={UDim2.fromScale(20, 20)}
			Adornee={props.target_instance}
			ClipsDescendants={false}
		>
			<frame
				Size={UDim2.fromScale(0.005, 0.005)}
				ClipsDescendants={false}
				Position={UIDIM.CENTER}
				AnchorPoint={UIDIM.A_CENTER}
				BackgroundTransparency={1}
			>
				<Line
					root_position={UIDIM.CENTER}
					Rotation={180}
					Length={(math.clamp(animated_value, 0, 0.7) / 0.7) * 30}
				>
					<Line
						root_position={UIDIM.CENTER}
						Rotation={70}
						Length={(math.clamp(animated_value - 0.7, 0, 0.3) / 0.3) * 5}
					>
						<frame
							BackgroundTransparency={1}
							Size={UDim2.fromScale(BOX_SIZE, BOX_SIZE)}
							AnchorPoint={UIDIM.A_CENTER}
							Position={UIDIM.RIGHT}
							ClipsDescendants={false}
							Rotation={-(180 + 70)}
						>
							<canvasgroup
								Size={UDim2.fromScale(10, 5)}
								AnchorPoint={UIDIM.A_BOTTOM}
								Position={UIDIM.CENTER}
								GroupTransparency={1 - animated_value}
							>
								<ProgressBarComponent
									text_size_multiplier={2}
									Text={props.text}
									Color={
										progress < 0.15
											? new Color3(1, 0, 0)
											: progress < 0.3
												? new Color3(1, 0.75, 0.24)
												: progress < 0.6
													? new Color3(0.06, 0.62, 0.9)
													: new Color3(0, 1, 0)
									}
									progress={props.progress}
									Size={UDim2.fromScale(300, 20)}
								/>
							</canvasgroup>
						</frame>
					</Line>
				</Line>
			</frame>
		</billboardgui>
	);
}

const BOX_SIZE = 1;
export function Line(props: {
	root_position: UDim2;
	Length: number;
	Rotation: number;
	children?: ReactNode;
}) {
	return (
		<frame
			Size={UDim2.fromScale(BOX_SIZE, BOX_SIZE)}
			AnchorPoint={UIDIM.A_CENTER}
			Position={props.root_position}
			ClipsDescendants={false}
			BackgroundTransparency={1}
			Rotation={props.Rotation}
		>
			<uiaspectratioconstraint AspectRatio={1} />
			<frame
				BorderSizePixel={0}
				ClipsDescendants={false}
				Position={UDim2.fromScale(0.5, 0.5)}
				AnchorPoint={UIDIM.A_LEFT}
				Size={new UDim2(props.Length, 0, 1, 0)}
				BackgroundColor3={new Color3(1, 1, 1)}
			>
				<frame
					BackgroundTransparency={1}
					ClipsDescendants={false}
					Size={UDim2.fromScale(BOX_SIZE, BOX_SIZE)}
					BackgroundColor3={new Color3(1, 0, 0)}
					AnchorPoint={UIDIM.A_CENTER}
					Position={UIDIM.RIGHT}
				>
					{props.children}
				</frame>
			</frame>
		</frame>
	);
}
