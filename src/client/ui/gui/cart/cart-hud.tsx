import React, { Fragment, useContext } from "@rbxts/react"
import { useCart } from "client/ui/contexts/cart.context"
import { CartButtons } from "./cart-buttons"
import { SpeedometerHud } from "./cart-speedometer"
import { StageProgress } from "./stage-progress"
import { useRendering } from "client/ui/hooks/useRendering"
import { useInputType } from "client/ui/hooks/useInputType"
import { GoofyText } from "client/ui/components/goofy-text"
import { MOUSE_KEYBOARD_BUTTONS, UIDIM } from "client/ui/constants"
import Object from "@rbxts/object-utils"
import useAnimateValue from "client/ui/hooks/useAnimateValue"
import { GuiContext } from "client/ui/contexts/gui-manager.context"

function KeyboardControls() {
	const inputType = useInputType()
	const cart = useCart().cart
	const value = useAnimateValue({
		target_value: (inputType === "Keyboard" && cart) ? 1 : 0,
		tween_info: new TweenInfo(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.InOut),
		enabled: true
	})

	return (
		<frame
			key="keyboard-controls"
			AnchorPoint={new Vector2(0, 1)}
			Position={new UDim2(0, 10, 1, -10)}
			Size={UDim2.fromScale(.1,.1).Lerp(UDim2.fromScale(0,0), 1-value)}
			BackgroundTransparency={0.6}
			BackgroundColor3={new Color3(0, 0, 0)}
			BorderSizePixel={0}
		>
			<uiaspectratioconstraint AspectRatio={2} />
			<uicorner CornerRadius={new UDim(0.1, 0)} />
			<uipadding
				PaddingTop={new UDim(0.1, 0)}
				PaddingBottom={new UDim(0.1, 0)}
				PaddingLeft={new UDim(0.1, 0)}
				PaddingRight={new UDim(0.1, 0)}
			/>
			<uigridlayout CellPadding={new UDim2(0.05, 0, 0.05, 0)} CellSize={new UDim2(1, 0, 1, 0)} >
				<uiaspectratioconstraint AspectRatio={5} />
			</uigridlayout>

			{Object.entries(MOUSE_KEYBOARD_BUTTONS).map(([action, keyCode]) => {
				const actionStr = action as string
				const displayText = actionStr.sub(0, 1).upper() + actionStr.sub(2).lower()
				return (
					<GoofyText
						key={action}
						Text={`${displayText}: ${keyCode.Name}`}
						TextXAlignment={Enum.TextXAlignment.Left}
						Size={new UDim2(1, 0, 1,0)}
						TextColor3={new Color3(1, 1, 1)}
						MaxTextSize={100}
						MinTextSize={10}
						IgnoreTextSizing={false}
					/>
				)
			})}
		</frame>
	)
}

export function CartHud(props: {
	__story?: {
		cart_enabled: boolean
		override_speed: number
		override_brake: boolean
		override_device: "Gamepad" | "Keyboard" | "Mobile"
	}
}) {
	const {cart}= useCart()
	const guiContext = useContext(GuiContext)
	const isShopOpen = guiContext.open_gui === "carts"
	
	// Hide cart HUD when shop is open
	if (isShopOpen) {
		return <Fragment />
	}
	
	return (
		<Fragment>
			{cart ? <StageProgress/> : undefined}
			<CartButtons  __story={props.__story} />
			<SpeedometerHud __story={props.__story} />
			<KeyboardControls />
		</Fragment>
	)
}
