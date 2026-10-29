import { useQuery } from "@rbxts/react-query"
import { Players } from "@rbxts/services"
import { LoadingIndicator } from "./loading-indicator"
import React, { PropsWithChildren, ReactNode, forwardRef } from "@rbxts/react"
import { UIDIM } from "../constants"

export const PlayerAvatar = forwardRef<
	ImageLabel,
	{
		user_id: number
		children?: ReactNode
		img_type?: Enum.ThumbnailType
	} & Partial<PropsWithChildren<ImageLabel>>
>((props, ref) => {
	let img_type = props.img_type ?? Enum.ThumbnailType.AvatarBust
	const { data, err: queryError, isPending, refetch } = useQuery({
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
		staleTime: math.huge
	})
	return (
		<imagelabel
			ref={ref}
			BackgroundTransparency={1}
			{...{ ...props, user_id: undefined,img_type:undefined }}
			Image={data}
			Size={props.Size || UIDIM.ONE}
		>
			<uiaspectratioconstraint AspectRatio={1} />
			{!data || isPending || queryError ? (
				<LoadingIndicator Size={UIDIM.ONE} />
			) : undefined}
			{props.children}
		</imagelabel>
	)
})
