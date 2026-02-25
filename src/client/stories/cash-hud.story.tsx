import React from "@rbxts/react"
import ReactRoblox from "@rbxts/react-roblox"
import { InferFusionProps,Number } from "@rbxts/ui-labs"
import { App } from "client/ui/App"
import { CashPopupSignal } from "shared/components/cash.component";

const controls = {
    emit: Number(3,0,30,1),
}

const story = {
	react: React,
	reactRoblox: ReactRoblox,
	controls: controls,
	story: (props: InferFusionProps<typeof controls>) => {
        for (let i = 0; i < props.controls.emit; i++) {
            CashPopupSignal.Fire(new Vector3(0, 0, 0));
        }
		return <App  />
	}
}

export = story
