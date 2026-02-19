import React from "@rbxts/react"

export interface GlitchBundleEntryProps {
	bundleName?: string
	items?: Array<{
		name: string
		quantity: number
		image?: string
	}>
	price?: string
	originalPrice?: string
	discountPercentage?: number
	onBuy?: () => void
}

export function GlitchBundleEntry(props: GlitchBundleEntryProps) {
	// TODO: Implement glitch bundle entry logic
	return (
		<frame
			key="GlitchBundleEntry"
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			Size={new UDim2(.99, 0, 0.491, 0)}
			Position={UDim2.fromScale(.005,0)}
		>
			<uistroke Thickness={5} />
			<uigradient
				Color={
					new ColorSequence([
						new ColorSequenceKeypoint(0, Color3.fromRGB(255, 0, 0)),
						new ColorSequenceKeypoint(0.166, Color3.fromRGB(255, 255, 0)),
						new ColorSequenceKeypoint(0.33, Color3.fromRGB(0, 255, 0)),
						new ColorSequenceKeypoint(0.5, Color3.fromRGB(0, 255, 255)),
						new ColorSequenceKeypoint(0.66, Color3.fromRGB(0, 0, 255)),
						new ColorSequenceKeypoint(0.833, Color3.fromRGB(255, 0, 255)),
						new ColorSequenceKeypoint(1, Color3.fromRGB(255, 0, 0))
					])
				}
				Enabled={false}
			/>
			<frame
				key="List"
				BackgroundTransparency={1}
				Position={new UDim2(0.327, 0, 0.12, 0)}
				Size={new UDim2(0.744, 0, 0.631, 0)}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Horizontal}
					Padding={new UDim(0.05, 0)}
					SortOrder={Enum.SortOrder.LayoutOrder}
					VerticalAlignment={Enum.VerticalAlignment.Center}
				/>
				<frame
					key="ItemContainer"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.55}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0, 0)}
					SelectionOrder={1}
					Size={new UDim2(0.152, 0, 1, 0)}
				>
					<uistroke Thickness={4} />
					<textlabel
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(-0.112, 0, -0.14100000000000001, 0)}
						Rotation={-6}
						Size={new UDim2(0.641, 0, 0.37, 0)}
						Text="x1"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
						TextXAlignment={Enum.TextXAlignment.Left}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<textlabel
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(0.08700000000000001, 0, 0.629, 0)}
						Size={new UDim2(0.809, 0, 0.37, 0)}
						Text="OP Egg"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<imagelabel
						BackgroundTransparency={1}
						Position={new UDim2(0.051000000000000004, 0, 0.06, 0)}
						Size={new UDim2(0.896, 0, 0.88, 0)}
						ZIndex={0}
					>
						<uiaspectratioconstraint />
					</imagelabel>
					<uiaspectratioconstraint />
					<uigradient
						Rotation={-90}
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 0, 0),
								new NumberSequenceKeypoint(1, 0.581, 0)
							])
						}
					/>
					<imagelabel
						key="Shadow"
						BackgroundTransparency={1}
						Image="rbxassetid://75600902046326"
						ImageColor3={Color3.fromRGB(0, 0, 0)}
						ImageTransparency={0.84}
						Size={new UDim2(1, 0, 1, 0)}
						ZIndex={5}
					/>
				</frame>
				<frame
					key="ItemContainer"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.55}
					BorderSizePixel={0}
					Position={new UDim2(0.218, 0, 0, 0)}
					SelectionOrder={1}
					Size={new UDim2(0.152, 0, 1, 0)}
				>
					<uistroke Thickness={4} />
					<textlabel
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(-0.112, 0, -0.14100000000000001, 0)}
						Rotation={-6}
						Size={new UDim2(0.641, 0, 0.37, 0)}
						Text="x1"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
						TextXAlignment={Enum.TextXAlignment.Left}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<textlabel
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(0.08700000000000001, 0, 0.629, 0)}
						Size={new UDim2(0.809, 0, 0.37, 0)}
						Text="OP Egg"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<imagelabel
						BackgroundTransparency={1}
						Position={new UDim2(0.051000000000000004, 0, 0.06, 0)}
						Size={new UDim2(0.896, 0, 0.879, 0)}
						ZIndex={0}
					>
						<uiaspectratioconstraint />
					</imagelabel>
					<uiaspectratioconstraint />
					<uigradient
						Rotation={-90}
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 0, 0),
								new NumberSequenceKeypoint(1, 0.581, 0)
							])
						}
					/>
					<imagelabel
						key="Shadow"
						BackgroundTransparency={1}
						Image="rbxassetid://75600902046326"
						ImageColor3={Color3.fromRGB(0, 0, 0)}
						ImageTransparency={0.84}
						Size={new UDim2(1, 0, 1, 0)}
						ZIndex={5}
					/>
				</frame>
				<frame
					key="ItemContainer"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.55}
					BorderSizePixel={0}
					Position={new UDim2(0.435, 0, 0, 0)}
					SelectionOrder={1}
					Size={new UDim2(0.152, 0, 1, 0)}
				>
					<uiaspectratioconstraint />
					<uigradient
						Rotation={-90}
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 0, 0),
								new NumberSequenceKeypoint(1, 0.581, 0)
							])
						}
					/>
					<uistroke Thickness={4} />
					<textlabel
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(-0.112, 0, -0.14100000000000001, 0)}
						Rotation={-6}
						Size={new UDim2(0.641, 0, 0.37, 0)}
						Text="x1"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
						TextXAlignment={Enum.TextXAlignment.Left}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<textlabel
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(0.08700000000000001, 0, 0.629, 0)}
						Size={new UDim2(0.809, 0, 0.37, 0)}
						Text="OP Egg"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<imagelabel
						BackgroundTransparency={1}
						Position={new UDim2(0.051000000000000004, 0, 0.06, 0)}
						Size={new UDim2(0.896, 0, 0.879, 0)}
						ZIndex={0}
					>
						<uiaspectratioconstraint />
					</imagelabel>
					<imagelabel
						key="Shadow"
						BackgroundTransparency={1}
						Image="rbxassetid://75600902046326"
						ImageColor3={Color3.fromRGB(0, 0, 0)}
						ImageTransparency={0.84}
						Size={new UDim2(1, 0, 1, 0)}
						ZIndex={5}
					/>
				</frame>
				<frame
					key="ItemContainer"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.55}
					BorderSizePixel={0}
					Position={new UDim2(0.653, 0, 0, 0)}
					SelectionOrder={1}
					Size={new UDim2(0.152, 0, 1, 0)}
				>
					<uistroke Thickness={4} />
					<uiaspectratioconstraint />
					<uigradient
						Rotation={-90}
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 0, 0),
								new NumberSequenceKeypoint(1, 0.581, 0)
							])
						}
					/>
					<textlabel
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(-0.112, 0, -0.14100000000000001, 0)}
						Rotation={-6}
						Size={new UDim2(0.641, 0, 0.37, 0)}
						Text="x1"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
						TextXAlignment={Enum.TextXAlignment.Left}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<textlabel
						BackgroundTransparency={1}
						Font={Enum.Font.GothamBlack}
						FontFace={
							new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Heavy,
								Enum.FontStyle.Normal
							)
						}
						Position={new UDim2(0.08700000000000001, 0, 0.629, 0)}
						Size={new UDim2(0.809, 0, 0.37, 0)}
						Text="OP Egg"
						TextColor3={Color3.fromRGB(255, 255, 255)}
						TextScaled={true}
						TextSize={14}
						TextWrapped={true}
					>
						<uistroke Thickness={3} />
					</textlabel>
					<imagelabel
						BackgroundTransparency={1}
						Position={new UDim2(0.051000000000000004, 0, 0.06, 0)}
						Size={new UDim2(0.896, 0, 0.879, 0)}
						ZIndex={0}
					>
						<uiaspectratioconstraint />
					</imagelabel>
					<imagelabel
						key="Shadow"
						BackgroundTransparency={1}
						Image="rbxassetid://75600902046326"
						ImageColor3={Color3.fromRGB(0, 0, 0)}
						ImageTransparency={0.84}
						Size={new UDim2(1, 0, 1, 0)}
						ZIndex={5}
					/>
				</frame>
			</frame>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(0, 0, 0)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Size={new UDim2(1, 0, 0.181, 0)}
				ZIndex={5}
			>
				<textlabel
					key="Label"
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.481, 0, 0.481, 0)}
					Size={new UDim2(0.468, 0, 0.782, 0)}
					Text="Limited Offer!"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					TextXAlignment={Enum.TextXAlignment.Left}
				>
					<uistroke Thickness={3} />
				</textlabel>
				<textlabel
					key="Save Text"
					AnchorPoint={new Vector2(1, 0.5)}
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.991, 0, 0.492, 0)}
					Size={new UDim2(0.468, 0, 0.625, 0)}
					Text="Sale %50!"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					TextXAlignment={Enum.TextXAlignment.Right}
					Visible={false}
				>
					<uistroke Thickness={3} />
					<uigradient
						Color={
							new ColorSequence([
								new ColorSequenceKeypoint(0, Color3.fromRGB(255, 144, 0)),
								new ColorSequenceKeypoint(1, Color3.fromRGB(255, 255, 0))
							])
						}
					/>
				</textlabel>
			</frame>
			<imagebutton
				key="Buy"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Position={new UDim2(0.74, 0, 0.717, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(0.23500000000000001, 0, 0.20500000000000002, 0)}
				ZIndex={5}
			>
				<uistroke Thickness={5.1000000000000005} />
				<uigradient
					Color={
						new ColorSequence([
							new ColorSequenceKeypoint(0, Color3.fromRGB(255, 148, 0)),
							new ColorSequenceKeypoint(1, Color3.fromRGB(247, 248, 148))
						])
					}
					Rotation={-90}
				/>
				<frame
					key="Bottom"
					BackgroundColor3={Color3.fromRGB(0, 0, 0)}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
					Position={new UDim2(0, 0, 0.921, 0)}
					Size={new UDim2(1, 0, 0.079, 0)}
				/>
				<imagelabel
					key="Tile"
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image="rbxassetid://120250412681646"
					ImageTransparency={0.6}
					Position={new UDim2(0.526, 0, 0.461, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.921, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
				/>
				<textlabel
					key="Price_Text"
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.181, 0, 0.167, 0)}
					Size={new UDim2(0.636, 0, 0.5760000000000001, 0)}
					Text=" N/A"
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke Thickness={3} />
				</textlabel>
				<textlabel
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(0.221, 0, -0.585, 0)}
					Size={new UDim2(0.641, 0, 0.5760000000000001, 0)}
					Text={""}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
					TextXAlignment={Enum.TextXAlignment.Left}
				>
					<uistroke Thickness={3} />
				</textlabel>
				<textlabel
					BackgroundTransparency={1}
					Font={Enum.Font.GothamBlack}
					FontFace={
						new Font(
							"rbxasset://fonts/families/GothamSSm.json",
							Enum.FontWeight.Heavy,
							Enum.FontStyle.Normal
						)
					}
					Position={new UDim2(-0.23600000000000002, 0, -0.20700000000000002, 0)}
					Rotation={-10}
					Size={new UDim2(0.636, 0, 0.446, 0)}
					Text="N/A"
					TextColor3={Color3.fromRGB(255, 0, 0)}
					TextScaled={true}
					TextSize={14}
					TextWrapped={true}
				>
					<uistroke Thickness={3} />
					<uistroke Thickness={3} />
					<frame
						BackgroundColor3={Color3.fromRGB(255, 0, 0)}
						BorderSizePixel={0}
						Position={new UDim2(0.08, 0, 0.402, 0)}
						Rotation={-10}
						Size={new UDim2(0.839, 0, 0.197, 0)}
					/>
				</textlabel>
			</imagebutton>
			<imagelabel
				key="Beam"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://117283961854969"
				ImageTransparency={0.5}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Fit}
				Size={new UDim2(2, 0, 2, 0)}
				ZIndex={0}
			/>
			<imagelabel
				key="Shadow"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://75600902046326"
				ImageColor3={Color3.fromRGB(0, 0, 0)}
				ImageTransparency={0.7000000000000001}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				Size={new UDim2(1.0010000000000001, 0, 1.088, 0)}
				ZIndex={0}
			/>
			<imagelabel
				key="Tile"
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				Image="rbxassetid://120250412681646"
				ImageTransparency={0.6}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				ScaleType={Enum.ScaleType.Tile}
				Size={new UDim2(1, 0, 1, 0)}
				TileSize={new UDim2(0, 75, 0, 75)}
			/>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0, 0, 1.026, 0)}
				Size={new UDim2(0.013000000000000001, 0, -0.845, 0)}
				ZIndex={5}
			/>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0.985, 0, 1.026, 0)}
				Size={new UDim2(0.013000000000000001, 0, -0.845, 0)}
				ZIndex={5}
			/>
			<frame
				key="Top"
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={0.7000000000000001}
				BorderSizePixel={0}
				Position={new UDim2(0.985, 0, 1.0230000000000001, 0)}
				Size={new UDim2(-0.972, 0, -0.059000000000000004, 0)}
				ZIndex={5}
			/>
			<textlabel
				BackgroundTransparency={1}
				Font={Enum.Font.GothamBlack}
				FontFace={
					new Font(
						"rbxasset://fonts/families/GothamSSm.json",
						Enum.FontWeight.Heavy,
						Enum.FontStyle.Normal
					)
				}
				Position={new UDim2(0.719, 0, -0.10200000000000001, 0)}
				Rotation={-10}
				Size={new UDim2(0.253, 0, 0.191, 0)}
				Text="%30 FREE"
				TextColor3={Color3.fromRGB(255, 0, 0)}
				TextScaled={true}
				TextSize={14}
				TextWrapped={true}
				ZIndex={50}
			>
				<uistroke Thickness={3} />
				<uistroke Thickness={3} />
			</textlabel>
			<imagelabel
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				Image="rbxassetid://1412150157"
				ScaleType={Enum.ScaleType.Crop}
				Size={new UDim2(1, 0, 1, 0)}
			/>
			<canvasgroup
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				GroupColor3={Color3.fromRGB(115, 255, 0)}
				GroupTransparency={0.19}
				Size={new UDim2(1, 0, 1, 0)}
			>
				<videoframe
					BackgroundTransparency={1}
					Looped={true}
					Playing={true}
					Size={new UDim2(1, 0, 1, 0)}
					TimePosition={24.240000000000002}
					Video="rbxassetid://5608411652"
					Volume={0}
				/>
			</canvasgroup>
		</frame>
	)
}
