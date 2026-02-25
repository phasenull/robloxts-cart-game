import React, { useEffect, useRef } from "@rbxts/react";
import { TweenService, Workspace } from "@rbxts/services";
import useAnimateValue from "../hooks/useAnimateValue";
import { A } from "shared/assets";
import { UIDIM } from "../constants";
import { calculatePitch,
UIHelper } from "client/ui.helper";
const DURATION = 0.5;
export function CashVFX(props: { spawnPosition: Vector3; seed: number }) {
	const { spawnPosition } = props;
	const thisRef = useRef<Frame>();
	const camera = Workspace.CurrentCamera;
	const [location, is_on_screen] = camera!.WorldToScreenPoint(spawnPosition)!;
	const this_size = thisRef.current?.AbsoluteSize ?? new Vector2(0, 0);
	const start_location = (location as Vector3)
		.add(
			new Vector3(
				math.noise(props.seed) * 400,
				math.noise(0, props.seed) * 400,
			),
		)
		.add(new Vector3(this_size.X, this_size.Y));
	const cash_label = (_G as { cash_label: Frame }).cash_label as
		| Frame
		| undefined;
	const path = (progress: number) => {
		const taraget_location = cash_label?.AbsolutePosition.add(
			new Vector2(
				(cash_label.AbsoluteSize.X * 3) / 4,
				cash_label.AbsoluteSize.Y / 2,
			),
		) as Vector2 | undefined;
		if (!taraget_location)
			return new Vector2(start_location.X, start_location.Y);
		const control_point = new Vector2(
			(start_location.X + taraget_location.X) * props.seed,
			start_location.Y - 100 * props.seed,
		);
		// Quadratic Bezier curve formula
		const x =
			(1 - progress) * (1 - progress) * start_location.X +
			2 * (1 - progress) * progress * control_point.X +
			progress * progress * taraget_location.X;
		const y =
			(1 - progress) * (1 - progress) * start_location.Y +
			2 * (1 - progress) * progress * control_point.Y +
			progress * progress * taraget_location.Y;
		return new Vector2(x, y);
	};
	useEffect(() => {
		if (!is_on_screen) return;
		if (thisRef.current) {
			thisRef.current.Position = new UDim2(
				0,
				start_location.X,
				0,
				start_location.Y,
			);
		}
		return () => {
			if (thisRef.current) {
				animateCashText();
				thisRef.current.Destroy();
			}
		};
	}, []);
	const transparency = useAnimateValue({
		target_value: 1,
		tween_info: new TweenInfo(
			0.2,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out,
			0,
			false,
			props.seed / 3,
		),
	});
	const value = useAnimateValue({
		target_value: 1,
		tween_info: new TweenInfo(
			DURATION,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out,
			0,
			false,
			1 - props.seed / 3,
		),
	});
	const final_pos = path(value);
	if (!is_on_screen) return;
	if (value === 1) {
		task.spawn(() => {
			if (thisRef.current) {
				animateCashText();
                const sound = UIHelper.playSound(A.sounds.ace.cash_ui);
				
				thisRef.current?.Destroy()
			}
		});
		return;
	}
	return (
		<frame
			key="CashVFX"
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundTransparency={1}
			Size={new UDim2(0.1, 0, 0.1, 0)}
			Position={new UDim2(0, final_pos.X, 0, final_pos.Y)}
			ref={thisRef}
            Rotation={props.seed*360*value}
		>
			<uiscale
				Scale={
					value > 0
						? -0.7 * math.pow(value, 2) + 1
						: -2 * math.pow(transparency - 0.7, 2) + 1
				}
			/>
			<imagelabel
				AnchorPoint={UIDIM.A_CENTER}
				Position={UIDIM.CENTER}
				BackgroundTransparency={1}
				ImageTransparency={1 - transparency}
				Image={A.icons.ace.cash}
				Size={UIDIM.ONE}
			/>
			<uiaspectratioconstraint AspectRatio={1} />
		</frame>
	);
}
function animateCashText() {
	const cash_label = (_G as { cash_label: TextLabel }).cash_label as
		| TextLabel
		| undefined;
	const original_size = new UDim2(0.75, 0, 0.807, 0) as UDim2 | undefined;
	assert(cash_label, "Cash label not found");
	assert(original_size, "Original size not found");
	const tween = TweenService.Create(
		cash_label,
		new TweenInfo(0.1, Enum.EasingStyle.Circular, Enum.EasingDirection.Out),
		{
			Size: new UDim2(
				original_size.X.Scale * 1.05,
				0,
				original_size.Y.Scale * 1.05,
				0,
			),
		},
	);
	tween.Play();
	tween.Completed.Wait();
	const tween2 = TweenService.Create(
		cash_label,
		new TweenInfo(0.1, Enum.EasingStyle.Circular, Enum.EasingDirection.Out),
		{ Size: original_size },
	);
	tween2.Play();
}
