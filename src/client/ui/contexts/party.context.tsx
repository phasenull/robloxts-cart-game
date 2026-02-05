import React, { createContext, useContext, useEffect } from "@rbxts/react"
import Signal from "@rbxts/signal"
import { __IS_EDIT__ } from "shared/config.helper"
import { Logger } from "shared/logger"
import { ClientEvents } from "shared/network.helper"
import { Party } from "shared/type.helper"
const PartyContext = createContext<{
	party: Party | undefined
	setParty: (newParty: Party | undefined) => void
}>({ party: undefined, setParty: () => {} })
const logger = new Logger("PartyContext")
export const __UNSAFE_SET_PARTY = new Signal<(party: Party | undefined) => void>()
export function PartyProvider(props: React.PropsWithChildren) {
	// Use a ref to store the party since React state can't handle Roblox Instances
	const [party, setParty] = React.useState<Party | undefined>(undefined)

	useEffect(() => {
		if (__IS_EDIT__) {
			__UNSAFE_SET_PARTY.Connect((party) => {
				setParty(party)
			})
			return
		}
		const conn = ClientEvents.PartyService.partyUpdated.connect(
			(updatedParty, msg) => {
				setParty(updatedParty)
				if (msg) {
					logger.log(`Party announcement: ${msg}`)
				}
			}
		)
		return () => {
			conn.Disconnect()
		}
	}, [setParty])

	return (
		<PartyContext.Provider value={{ party, setParty }}>
			{props.children}
		</PartyContext.Provider>
	)
}
export function useParty() {
	const context = useContext(PartyContext)
	return context
}
