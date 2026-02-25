import React, { useEffect, useRef, useState } from "@rbxts/react";
import { UIDIM } from "../constants";
import { ClientEvents, ClientFunctions } from "shared/network.helper";
import { formatCash } from "shared/util.helper";
import { useQuery } from "@rbxts/react-query";
import { __IS_EDIT__ } from "shared/config.helper";
import { MOCK_CASH } from "shared/mocks";
import { useInputType } from "../hooks/useInputType";
import { useNavigator } from "../hooks/useNavigator";
import { CashPopupSignal } from "../components/cash-hud";

export function CashLabel() {
	const [cash, setCash] = useState<number | undefined>(MOCK_CASH);
	const navigator = useNavigator();
	const { data: initialCash } = useQuery({
		queryKey: ["player-cash"],
		queryFn: async () => {
			if (__IS_EDIT__) {
				return MOCK_CASH;
			}
			const [result, err] = await ClientFunctions.DataService.getCash();
			if (err || result === false) {
				throw err;
			}
			setCash(result);
			return result;
		},
		refetchInterval: 30_000,
	});

	useEffect(() => {
		if (thisRef.current) {
			(_G as any).cash_label = thisRef.current;
		}
		if (__IS_EDIT__) return;
		const conn = ClientEvents.DataService.updatePlayerCash.connect((amount) => {
			setCash(amount);
		});
		return () => conn.Disconnect();
	}, []);
	const thisRef = useRef<TextLabel>();
	return (
		<frame
			key="CashLabel"
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			Size={UDim2.fromScale(1, 1)}
		>
			<uiscale Scale={1.4} />
			<textlabel
				key="CashText"
				AnchorPoint={new Vector2(1, 0.5)}
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				Position={new UDim2(0.97, 0, 0.5, 0)}
				Size={new UDim2(0.75, 0, 0.807, 0)}
				Text={formatCash(cash ?? 0)}
				TextColor3={Color3.fromRGB(255, 255, 255)}
				TextScaled={true}
				ref={thisRef}
				TextSize={14}
				TextWrapped={true}
				TextXAlignment={Enum.TextXAlignment.Right}
			>
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(66, 214, 0)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(255, 251, 0)),
						])
					}
					Rotation={-90}
				/>
				<uistroke
					StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Color={Color3.fromRGB(45, 45, 45)}
					Thickness={0.1}
				/>
			</textlabel>
			<uigradient
				Rotation={180}
				Transparency={
					new NumberSequence([
						new NumberSequenceKeypoint(0, 0.294, 0),
						new NumberSequenceKeypoint(1, 1, 0),
					])
				}
			/>
			<uistroke
				StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				Thickness={0.1}
			>
				<uigradient
					Rotation={180}
					Transparency={
						new NumberSequence([
							new NumberSequenceKeypoint(0, 0.806, 0),
							new NumberSequenceKeypoint(1, 1, 0),
						])
					}
				/>
			</uistroke>
			<imagebutton
				key="Plus"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.08, 0, 0.5, 0)}
				Size={new UDim2(0.55, 0, 0.55, 0)}
				Event={{
					MouseButton1Click: () => {
						// navigator.setOpenGui("rotten-shop");
						CashPopupSignal.Fire(Vector3.zero);
						CashPopupSignal.Fire(Vector3.zero);
						CashPopupSignal.Fire(Vector3.zero);
						CashPopupSignal.Fire(Vector3.zero);
					},
				}}
			>
				<uiaspectratioconstraint AspectRatio={0.985} />
				<textlabel
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					Size={new UDim2(1, 0, 1, 0)}
					Text="+"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke
						StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						Thickness={0.1}
					/>
				</textlabel>
				<imagelabel
					key="Tile"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://120250412681646"
					ImageTransparency={0.6}
					Position={new UDim2(0.527, 0, 0.472, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1.053, 0, 0.943, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<frame
					key="Bottom"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.921, 0)}
					Size={new UDim2(1, 0, 0.079, 0)}
				/>
				<uistroke
					StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Thickness={0.1}
				/>
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(62, 216, 40)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(171, 248, 71)),
						])
					}
					Rotation={-90}
				/>
			</imagebutton>
			<imagelabel
				BackgroundTransparency={1}
				Image="rbxassetid://71695823398046"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.8}
				Size={new UDim2(1, 0, 0.921, 0)}
				ZIndex={0}
			>
				<uigradient
					Rotation={180}
					Transparency={
						new NumberSequence([
							new NumberSequenceKeypoint(0, 0.294, 0),
							new NumberSequenceKeypoint(1, 1, 0),
						])
					}
				/>
			</imagelabel>
			<uiaspectratioconstraint
				AspectRatio={3}
				AspectType={Enum.AspectType.ScaleWithParentSize}
				DominantAxis={Enum.DominantAxis.Height}
			/>
		</frame>
	);
}

export function GlobalHUDGui() {
	const device = useInputType();
	return (
		<frame Size={UIDIM.ONE} BackgroundTransparency={1}>
			<textlabel
				BackgroundTransparency={1}
				Size={UDim2.fromScale(0.2, 0.03)}
				TextScaled={true}
				TextXAlignment={Enum.TextXAlignment.Left}
				Position={new UDim2(0, 5, 1, -5)}
				Interactable={false}
				Font={Enum.Font.GothamMedium}
				TextColor3={new Color3(1, 1, 1)}
				AnchorPoint={new Vector2(0, 1)}
				TextStrokeTransparency={0}
				Text={`v${game.PlaceVersion}-${device.sub(0, 1)}`}
			>
				<uiaspectratioconstraint AspectRatio={5} />
			</textlabel>
		</frame>
	);
}
