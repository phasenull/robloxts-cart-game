import React from "@rbxts/react";
import ReactRoblox from "@rbxts/react-roblox";
import { Choose, InferFusionProps } from "@rbxts/ui-labs";
import { App } from "client/ui/App";
import { Badge } from "client/common/ui/components/badge";
import { EmptyContainer } from "client/common/ui/components/empty-container";
import { SidebarButton } from "client/common/ui/components/buttons/sidebar-button";
import { GUI_KEYS } from "client/common/ui/constants";
import Sidebar from "client/ui/gui/sidebar";
import { A } from "shared/common/assets";

const controls = {
	text: "NEW!",
	icon: A.icons.warning,
	color: new Color3(1, 0, 0),
	use: Choose(["text","icon"]),
	shine: false,
};

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
		return (
			<EmptyContainer>
				<uipadding
					PaddingTop={new UDim(0.2, 0)}
					PaddingBottom={new UDim(.2, 0)}
					PaddingLeft={new UDim(.2, 0)}
					PaddingRight={new UDim(.2, 0)}
				/>
				<SidebarButton 
						shine={props.controls.shine} icon={A.icons.cart}>
					<Badge
						icon={
							props.controls.use === "icon" ? props.controls.icon : undefined
						}
						text={
							props.controls.use === "text" ? props.controls.text : undefined
						}
						color={props.controls.color}
					/>
				</SidebarButton>
			</EmptyContainer>
		);
	},
};

export = story;
