import { Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import React from "@rbxts/react"
import { useQuery } from "@rbxts/react-query"
import { Players } from "@rbxts/services"
import { PlotClientComponent } from "client/components/plot.client.component"
import { EmptyContainer } from "client/ui/components/empty-container"
import { GoofyText } from "client/ui/components/goofy-text"
import { LoadingIndicator } from "client/ui/components/loading-indicator"
import { SidebarButton } from "client/ui/components/buttons/sidebar-button"
import { __STUDIO__, PRIMARY, UIDIM } from "client/ui/constants"
import { useErrorPage } from "client/ui/contexts/error.context"
import { useNavigator } from "client/ui/hooks/useNavigator"
import { A } from "shared/assets"
import { ClientFunctions } from "shared/network.helper"
import { PartyInfo } from "./party-info/party-info-gui"
import { PartyMaker } from "./party-maker"
import { Party } from "shared/type.helper"
import { __IS_EDIT__ } from "shared/config.helper"
import { useParty } from "client/ui/contexts/party.context"

export function PartyGui(props: {
	__story?: {
		party_enabled: boolean
	}
}) {
	const { showError } = useErrorPage()
	const { party, setParty } = useParty()
	const { data, isLoading, refetch } = useQuery({
		queryKey: [`party-info-${party}-${props.__story?.party_enabled}`],
		queryFn: async () => {
			if (__IS_EDIT__) {
				if (!props.__story?.party_enabled) {
					return { party: undefined, is_in_party: false }
				}
				const data = {
					party: {
						guid: "STUDIO-PARTY",
						owner: Players.GetPlayers()[0],
						players: Players.GetPlayers(),
						invites: [],
						is_public: true,
						max_players: 2
					} as unknown as Party,
					is_in_party: true
				}
				setParty(data.party)
				return data
			}
			const [new_party, err] =
				await ClientFunctions.PartyService.getPartyState.invokeWithTimeout(5000)
			setParty(new_party === false ? undefined : new_party)
			if (err || new_party === false) {
				error(`Failed to get party state: ${err}`)
			}
			return { party: new_party, is_in_party: new_party !== undefined }
		},
		staleTime:0,

		onError: (err) => {
			showError({
				message: tostring(err),
				title: "Failed to fetch party info",
				onClose: () => {}
			})
		}
	})
	if (party) {
		return <PartyInfo />
	}
	return <PartyMaker  />
}
