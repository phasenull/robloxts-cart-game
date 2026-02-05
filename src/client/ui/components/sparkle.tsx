import { A } from "shared/assets";
import { Icon } from "./icon";
import React, { Fragment } from "@rbxts/react";
import useAnimateValue from "../hooks/useAnimateValue";
import { useRadians, useRendering } from "../hooks/useRendering";
import { UIDIM } from "../constants";
import { Timer } from "./timer";
import { Spark } from "./single-spark";

export function Sparkle() {
	return (
		<Fragment>
			<Spark Position={new UDim2(0.7, 0, 0.6, 0)}/>
			<Spark Position={new UDim2(0.2, 0, 0.5, 0)}/>
			<Spark Position={new UDim2(0.50, 0, 0.30, 0)}/>
		</Fragment>
	);
}
