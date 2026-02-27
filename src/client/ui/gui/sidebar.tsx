import React, { useContext } from "@rbxts/react";
import { GUI_KEYS, PRIMARY } from "@common/client/ui/constants";
import { SidebarButton } from "@common/client/ui/components/buttons/sidebar-button";
import { A } from "@common/shared/assets";
import { GuiContext } from "@common/client/ui/contexts/gui-manager.context";
import useAnimateValue from "@common/client/ui/hooks/useAnimateValue";
import { Lighting } from "@rbxts/services";
import { Badge } from "@common/client/ui/components/badge";
export default function Sidebar() {
	const { is_sidebar_open, setOpenGui } = useContext(GuiContext);
	const horizontal_size = 0.2;
	function props_callback(gui_key: GUI_KEYS) {
		setOpenGui((old) => (old === gui_key ? undefined : gui_key));
	}
	const value = useAnimateValue({
		target_value: is_sidebar_open ? 0 : 1,
		tween_info: new TweenInfo(
			0.4,
			Enum.EasingStyle.Quad,
			Enum.EasingDirection.Out,
		),
	});
	return (
		<frame
			AnchorPoint={new Vector2(0, 0.5)}
			Position={new UDim2(-0.1 * value, 10, 0.35, 0)}
			Size={new UDim2(horizontal_size, 0, horizontal_size, 0)}
			BorderSizePixel={0}
			BackgroundTransparency={1}
			ClipsDescendants={false}
		>
			<uiaspectratioconstraint AspectRatio={1} />
			<uigridlayout
				CellPadding={new UDim2(0.1, 0, 0.1, 0)}
				CellSize={new UDim2(0.45, 0, 0.45, 0)}
				FillDirection={"Horizontal"}
				FillDirectionMaxCells={2}
			>
				<uiaspectratioconstraint AspectRatio={1} />
			</uigridlayout>
			<SidebarButton
				shine
				BackgroundColor3={new Color3(0.96, 0.78, 0)}
				ZIndex={2}
				ui_key="shop"
				icon={A.icons.cart}
			>
				<Badge ratio={2.5} text="NEW!" />
			</SidebarButton>
			{/* 
			<SidebarButton ui_key="gift" icon={A.icons.gift} />
			<SidebarButton ui_key="items" icon={A.icons.backpack} />
			<SidebarButton ui_key="settings" icon={A.icons.settings} /> */}
			<SidebarButton ui_key="cart" icon={A.icons.cart} />
			<SidebarButton ui_key="feedback" icon={A.icons.hammer} />
		</frame>
	);
}
