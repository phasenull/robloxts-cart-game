import React, { useEffect, useRef } from "@rbxts/react"
import { EmptyContainer } from "client/ui/components/empty-container"
import { PurchasableContainer } from "client/ui/components/purchasable-container"
import { GoofyButton } from "client/ui/components/buttons/goofy-button"
import { PRIMARY, UIDIM } from "client/ui/constants"
import { A } from "shared/assets"
import { purchasables } from "shared/purchasables"
import { Gamepasses } from "./shop/gamepasses"
import { Products } from "./shop/products"
import { Badge } from "client/ui/components/badge"
const frames = ["PASSES", "PRODUCTS", "BUNDLES"] as const
export function ShopGui() {
	const [viewing_frame, set_viewing_frame] =
		React.useState<(typeof frames)[number]>("PASSES")
	const page_ref = useRef<UIPageLayout>()
	useEffect(() => {
		if (!page_ref.current) return
		const index = frames.indexOf(viewing_frame)
		print("Switching to frame", viewing_frame, index)
		page_ref.current.JumpToIndex(index)
	}, [viewing_frame])
	return (
		<EmptyContainer Corner={new UDim(0.05, 0)} Size={new UDim2(1, 0, 1, 0)}>
			<uipadding
				PaddingLeft={new UDim(0.03, 0)}
				PaddingRight={new UDim(0.03, 0)}
			/>
			<frame
				Size={new UDim2(1, 0, 0.1, 0)}
				BackgroundTransparency={0}
				BorderSizePixel={0}
				BackgroundColor3={PRIMARY}
				ZIndex={1}
			>
				<uigridlayout
					FillDirection={Enum.FillDirection.Horizontal}
					CellPadding={new UDim2(0.05, 0, 0, 0)}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					CellSize={new UDim2(1, 0, 1, 0)}
				>
					<uiaspectratioconstraint AspectRatio={2} />
				</uigridlayout>
				<GoofyButton
					Text="PASSES"
					Color={new Color3(0.87, 0.16, 0.16)}
					OnClick={() => {
						set_viewing_frame("PASSES")
					}}
					Image={A.ui.button_horizontal}
				>
					<imagelabel
						Size={new UDim2(1.2, 0, 1.2, 0)}
						ImageTransparency={viewing_frame === "PASSES" ? 0 : 1}
						Image={A.ui.corner}
						ZIndex={2}
						AnchorPoint={UIDIM.A_CENTER}
						Position={UIDIM.CENTER}
						SliceCenter={new Rect(new Vector2(195, 174), new Vector2(221, 199))}
						ScaleType={Enum.ScaleType.Slice}
						Active={false}
						Selectable={false}
						Interactable={false}
						BackgroundTransparency={1}
					/>
				</GoofyButton>
				<GoofyButton
					Text="PRODUCTS"
					Image={A.ui.button_horizontal}
					Color={new Color3(0.91, 0.77, 0)}
					OnClick={() => {
						set_viewing_frame("PRODUCTS")
					}}
				>
					<imagelabel
						Size={new UDim2(1.2, 0, 1.2, 0)}
						ImageTransparency={viewing_frame === "PRODUCTS" ? 0 : 1}
						Image={A.ui.corner}
						ZIndex={2}
						AnchorPoint={UIDIM.A_CENTER}
						Position={UIDIM.CENTER}
						SliceCenter={new Rect(new Vector2(195, 174), new Vector2(221, 199))}
						ScaleType={Enum.ScaleType.Slice}
						Active={false}
						Selectable={false}
						Interactable={false}
						BackgroundTransparency={1}
					/>
				</GoofyButton>
				<GoofyButton
					Image={A.ui.button_horizontal}
					Text="BUNDLES"
					Color={new Color3(0.56, 0.17, 1)}
					OnClick={() => {
						set_viewing_frame("BUNDLES")
					}}
				>
					<Badge ratio={3} text="SALE!"/>
					<imagelabel
						Size={new UDim2(1.2, 0, 1.2, 0)}
						ImageTransparency={viewing_frame === "BUNDLES" ? 0 : 1}
						Image={A.ui.corner}
						ZIndex={2}
						AnchorPoint={UIDIM.A_CENTER}
						Position={UIDIM.CENTER}
						SliceCenter={new Rect(new Vector2(195, 174), new Vector2(221, 199))}
						ScaleType={Enum.ScaleType.Slice}
						Active={false}
						Selectable={false}
						Interactable={false}
						BackgroundTransparency={1}
					/>
				</GoofyButton>
			</frame>
			<frame
				ClipsDescendants
				BackgroundTransparency={1}
				Size={new UDim2(1, 0, 0.9, 0)}
				Position={new UDim2(0.5, 0, 1, 0)}
				AnchorPoint={UIDIM.A_BOTTOM}
				ZIndex={0}
			>
				<uipagelayout ref={page_ref} TweenTime={0.3} EasingStyle={Enum.EasingStyle.Quint}/>
				<Gamepasses />
				<Products />
				<Gamepasses />
			</frame>
		</EmptyContainer>
	)
}
