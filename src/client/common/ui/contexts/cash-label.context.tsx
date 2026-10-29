import React, { createContext, useRef } from "@rbxts/react"

/** The HUD's cash label, which the cash VFX flies to and bumps (was `_G.cash_label`). */
export const CashLabelContext = createContext<{ current?: TextLabel }>({})

export function CashLabelProvider(props: React.PropsWithChildren<{}>) {
	const label = useRef<TextLabel>()
	return <CashLabelContext.Provider value={label}>{props.children}</CashLabelContext.Provider>
}
