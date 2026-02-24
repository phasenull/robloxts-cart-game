import React, { useEffect, useState } from "@rbxts/react";
import { Players, RunService, Workspace } from "@rbxts/services";
import { CartClientComponent } from "client/components/cart.client.component";
import { GoofyText } from "client/ui/components/goofy-text";
import { UIDIM } from "client/ui/constants";
import { useCart } from "client/ui/contexts/cart.context";
import useAnimateValue from "client/ui/hooks/useAnimateValue";
import { A, assets } from "shared/assets";
import { Logger } from "shared/logger";
import { useInputType } from "client/ui/hooks/useInputType";
const logger = new Logger("SpeedometerHud");

const MAX_SPEED = 70;
const SPEEDLINES_OFFSET = 12; // studs in front of camera
const SPEEDLINES_MAX_RATE = 1000;
const SPEEDLINES_MAX_SPEED_MIN = 20;
const SPEEDLINES_MAX_SPEED_MAX = 25;
export function SpeedometerHud(props: {
	__story?: {
		cart_enabled: boolean;
		override_speed: number;
		override_device?: "Gamepad" | "Keyboard" | "Mobile";
	};
}) {
	const { cart, state } = useCart();
	const device = props.__story?.override_device ?? useInputType();
	const isMobile = device === "Mobile";
	const max_speed = MAX_SPEED;
	const degrees_range = isMobile ? [20, 160] : [-20, 110];
	const [speed, set_speed] = useState<number>(0);
	const death_speed = 130;
	let target_speed = props.__story?.override_speed ?? speed;
	const is_death = target_speed >= death_speed;
	if (is_death) {
		target_speed = death_speed;
	}
	// const speed = useAnimateValue({
	// 	initial_value: 0,
	// 	target_value: 100,
	// 	tween_info: new TweenInfo(
	// 		0.5,
	// 		Enum.EasingStyle.Sine,
	// 		Enum.EasingDirection.InOut,
	// 		-1,
	// 		true
	// 	),
	// 	enabled: true
	// })
	const degree =
		(target_speed / max_speed) * (degrees_range[1] - degrees_range[0]) +
		degrees_range[0];
	const speed_keypoints = [0, 10, 20, 30, 40, 50, 60, 70];
	useEffect(() => {
		if (!cart) {
			return;
		}
		const part = cart.instance.Root;
		const connection = RunService.Heartbeat.Connect(() => {
			const velocity = part.AssemblyLinearVelocity;
			const current_speed = velocity.Magnitude;
			set_speed(current_speed);
		});
		return () => {
			connection?.Disconnect();
		};
	}, [cart]);

	// ─── Speedlines VFX ───────────────────────────────────────────────────────
	useEffect(() => {
		if (!cart) return;

		const speedlinesPart = assets.Speedlines.Clone();
		const emitter = speedlinesPart.Lines.Attachment.ParticleEmitter;
		emitter.Enabled = false;
		speedlinesPart.Parent = Workspace.CurrentCamera ?? Workspace;

		// Update CFrame on RenderStepped so it stays locked to camera without lag
		const renderStepped = RunService.RenderStepped.Connect(() => {
			const camera = Workspace.CurrentCamera;
			if (!camera) return;
			const currentSpeed = cart.instance.Root.AssemblyLinearVelocity.Magnitude;
			emitter.Enabled = currentSpeed >= 50;
			if (!emitter.Enabled) return;
			const aspectRatio = camera.ViewportSize.X / camera.ViewportSize.Y;
			const baseScale = aspectRatio > 1.25 ? 1.21 : 0.968;
			const fovAlpha = math.clamp((camera.FieldOfView - 70) / 30, 0, 1);
			const scale = baseScale * (1 + fovAlpha * 0.5);
			speedlinesPart.ScaleTo(scale);
			speedlinesPart.PivotTo(
				camera.CFrame.mul(new CFrame(0, 0, -SPEEDLINES_OFFSET)),
			);
		});

		return () => {
			renderStepped.Disconnect();
			speedlinesPart.Destroy();
		};
	}, [cart]);
	useEffect(() => {
		return () => {
			if (!camera) {
				return;
			}
			camera.FieldOfView = 70;
		};
	}, []);
	const is_open = cart || props.__story?.cart_enabled;
	const value = useAnimateValue({
		target_value: is_open ? 1 : 0,
		tween_info: new TweenInfo(
			1,
			Enum.EasingStyle.Quint,
			Enum.EasingDirection.InOut,
		),
	});
	const default_fov = 70;
	const camera = Workspace.CurrentCamera;
	if (camera && cart) {
		const min_degrees = 20;
		const max_degrees = 120;
		const added_fov = 30;
		const calculated_fov =
			default_fov +
			math.clamp(
				((target_speed - min_degrees) / (max_degrees - min_degrees)) *
					added_fov,
				0,
				added_fov,
			);
		camera.FieldOfView = calculated_fov;
	}
	const death_value = useAnimateValue({
		target_value: is_death ? 1 : 0,
		tween_info: new TweenInfo(
			0.2,
			Enum.EasingStyle.Sine,
			Enum.EasingDirection.InOut,
		),
		enabled: !isMobile,
	});
	return (
		<frame
			key={"movement-scaler"}
			Size={new UDim2(0.3, 0, 0.3, 0)}
			AnchorPoint={
				isMobile
					? UIDIM.A_CENTER.add(new Vector2(0, 0.1))
					: new Vector2(0.8, 0.8)
			}
			Position={isMobile ? UIDIM.BOTTOM_CENTER : new UDim2(1, 0, 1, 0)}
			BackgroundTransparency={1}
		>
			<uiaspectratioconstraint AspectRatio={1} />
			<frame
				key={"movement-component"}
				BorderSizePixel={0}
				Size={new UDim2(1, 0, 1, 0)}
				AnchorPoint={new Vector2(0.5, 0.5)}
				Position={
					new UDim2(
						0.5 + (isMobile ? 0 : 1 - value - death_value * 0.2),
						0,
						0.5 + (1 - value) - death_value * 0.2,
						0,
					)
				}
				BackgroundTransparency={0.5}
			>
				<imagelabel
					Size={UIDIM.ONE}
					TileSize={new UDim2(0, 200, 0, 200)}
					ScaleType={Enum.ScaleType.Tile}
					Image={A.ui.tile}
					ImageColor3={new Color3(0, 0, 0)}
					ImageTransparency={0.5}
					BackgroundTransparency={1}
				>
					<uistroke
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1}
						Color={new Color3(0, 0, 0)}
					/>
					<uicorner CornerRadius={new UDim(1, 0)} />
				</imagelabel>
				<uicorner CornerRadius={new UDim(1, 0)} />
				<frame
					BackgroundTransparency={1}
					Size={new UDim2(1.05, 0, 1.05, 0)}
					AnchorPoint={isMobile ? UIDIM.A_CENTER : UIDIM.A_BOTTOM_RIGHT}
					Position={isMobile ? UIDIM.CENTER : UIDIM.BOTTOM_RIGHT}
				>
					{speed_keypoints.map((speed_value) => (
						<frame
							Rotation={
								(speed_value / max_speed) *
									(degrees_range[1] - degrees_range[0]) +
								degrees_range[0]
							}
							AnchorPoint={UIDIM.A_CENTER}
							Size={new UDim2(0.05, 0, 0.05, 0)}
							Position={
								isMobile
									? UIDIM.CENTER.add(UDim2.fromScale(0, 0.1))
									: new UDim2(0.6, 0, 0.6, 0)
							}
							key={"dot"}
							BackgroundTransparency={1}
						>
							<textlabel
								BackgroundTransparency={1}
								TextScaled
								Rotation={
									(speed_value / max_speed) *
										(degrees_range[1] - degrees_range[0]) +
										degrees_range[0] >
									90
										? 180
										: 0
								}
								AnchorPoint={UIDIM.A_LEFT}
								Size={new UDim2(3, 0, 3, 0)}
								Position={
									new UDim2(
										-11.5 + math.abs(max_speed / 2 - speed_value) / 15,
										0,
										0.5,
										0,
									)
								}
								Text={`${speed_value}`}
								TextColor3={new Color3(1, 1, 1)}
								Font={Enum.Font.FredokaOne}
							>
								<uiaspectratioconstraint AspectRatio={1} />
							</textlabel>
						</frame>
					))}
				</frame>
				<uiaspectratioconstraint AspectRatio={1} />
				{/* <GoofyText
					Position={
						new UDim2(1.3-death_value*.3, 0, 1.3-death_value*.3-.105, 0)
					}
					AnchorPoint={UIDIM.A_BOTTOM_RIGHT}
					Text={"🔥"}
					TextScaled
					MaxTextSize={200}
					Size={new UDim2(.3,0,.3,0)}
				/>
				<GoofyText
					Position={
						new UDim2(1.3-death_value*.3, 0, 1.3-death_value*.3, 0)
					}
					AnchorPoint={UIDIM.A_BOTTOM_RIGHT}
					Text={"💀"}
					TextScaled
					MaxTextSize={200}
					Size={new UDim2(.3,0,.3,0)}
				/> */}
				{isMobile ? undefined : (
					<GoofyText
						Position={
							new UDim2(1.3 - death_value * 0.3, 0, 1.3 - death_value * 0.3, 0)
						}
						AnchorPoint={UIDIM.A_BOTTOM_RIGHT}
						Text={"☠️"}
						TextScaled
						MaxTextSize={200}
						Size={new UDim2(0.3, 0, 0.3, 0)}
					/>
				)}
				<frame
					Rotation={math.clamp(
						degree,
						0,
						isMobile ? degrees_range[1] + 20 : 360,
					)}
					AnchorPoint={UIDIM.A_CENTER}
					Size={new UDim2(0.05, 0, 0.05, 0)}
					Position={
						isMobile
							? UIDIM.CENTER.add(UDim2.fromScale(0, 0.1))
							: new UDim2(0.6, 0, 0.6, 0)
					}
					key={"dot"}
					BackgroundTransparency={1}
				>
					<frame
						Size={new UDim2(8, 0, 10, 0)}
						BackgroundColor3={new Color3(1, 0, 0)}
						BorderSizePixel={0}
						AnchorPoint={new Vector2(1, 0.5)}
						Position={new UDim2(0.5, 0, 0.5, 0)}
					>
						<uicorner CornerRadius={new UDim(1, 0)} />
						<uiaspectratioconstraint AspectRatio={20} />
					</frame>
				</frame>
			</frame>
		</frame>
	);
}
