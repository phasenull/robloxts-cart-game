import { useQuery } from "@rbxts/react-query"
import { Players } from "@rbxts/services"
import { LoadingIndicator } from "./loading-indicator"
import React, { PropsWithChildren, ReactNode } from "@rbxts/react"
import { UIDIM } from "../constants"

export function PlayerAvatar(
	props: {
		user_id: number
		children?: ReactNode
		img_type?: Enum.ThumbnailType
	} & Partial<PropsWithChildren<ImageLabel>>
) {
	let img_type = props.img_type ?? Enum.ThumbnailType.AvatarBust
	const { data, err, isLoading, refetch } = useQuery({
		queryKey: [`player-avatar-${props.user_id}-${props.Size}`],
		queryFn: async () => {
			const [thumbnail_data, is_ready] = Players.GetUserThumbnailAsync(
				props.user_id,
				img_type,
				Enum.ThumbnailSize.Size100x100
			)
			if (!is_ready || !thumbnail_data) {
				return ""
			}
			return thumbnail_data
		},
		onError: (err) => {
			// warn(`Error fetching player avatar for user_id ${props.user_id}: ${err}`)
		},
		staleTime: math.huge
	})
	return (
		<imagelabel
			BackgroundTransparency={1}
			{...{ ...props, user_id: undefined,img_type:undefined }}
			Image={data}
			Size={props.Size || UIDIM.ONE}
		>
			<uiaspectratioconstraint AspectRatio={1} />
			{!data || isLoading || err ? (
				<LoadingIndicator Size={UIDIM.ONE} />
			) : undefined}
			{props.children}
		</imagelabel>
	)
}
