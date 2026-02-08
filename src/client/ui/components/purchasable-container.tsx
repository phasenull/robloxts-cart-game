import React, { useEffect, useState } from "@rbxts/react"
import { __STUDIO__, UIDIM } from "../constants"
import { A } from "shared/assets"
import { GoofyText } from "./goofy-text"
import { useMutation, useQuery } from "@rbxts/react-query"
import { MarketplaceService, Players, RunService } from "@rbxts/services"
import { LoadingIndicator } from "./loading-indicator"
import { GoofyButton } from "./buttons/goofy-button"
import { Logger } from "shared/logger"
import { EmptyContainer } from "./empty-container"
import { useErrorPage } from "../contexts/error.context"
import Object from "@rbxts/object-utils"
import { extractMessageFromError } from "shared/util.helper"
import { useNavigator } from "../hooks/useNavigator"
import { Sparkle } from "./sparkle"
import { UIHelper } from "client/ui.helper"
const logger = new Logger("GamepassContainer")
export function PurchasableContainer<T extends "gamepass" | "product">(props: {
	purchasable_id: number
	purchasable_type: T
}) {
	const { showError } = useErrorPage()
	const navigator = useNavigator()
	const {
		isLoading,
		data,
		refetch: refetchProductInfo
	} = useQuery({
		queryKey: [`gamepass-info-${props.purchasable_id}`],
		queryFn: async () => {
			let info = MarketplaceService.GetProductInfoAsync(
				props.purchasable_id,
				props.purchasable_type === "gamepass"
					? Enum.InfoType.GamePass
					: Enum.InfoType.Product
			) as T extends "gamepass" ? GamePassProductInfo : DeveloperProductInfo

			return info
		},
		onError: (err) => {
			logger.warn(err as string)
			showError({
				message: `${extractMessageFromError(err as string)}\n\nPurchasable ID: ${props.purchasable_id}`,
				title: `Failed to get product data!`,
				onClose: () => {},
				retry: () => refetchProductInfo()
			})
		}
	})
	const {
		isLoading: isOwnedLoading,
		data: isOwned,
		refetch: refetchOwned
	} = useQuery({
		queryKey: [`gamepass-owned-${props.purchasable_id}`],
		queryFn: async () => {
			const owned = MarketplaceService.UserOwnsGamePassAsync(
				Players.LocalPlayer.UserId,
				props.purchasable_id
			)
			return owned
		},
		enabled: props.purchasable_type === "gamepass"
	})
	const {
		isLoading: isPromptLoading,
		data: isPromptFinished,
		mutate: promptPurchase
	} = useMutation({
		mutationFn: async (args: { gamepass_id: number }) => {
			if (props.purchasable_type === "gamepass") {
				MarketplaceService.PromptGamePassPurchase(
					Players.LocalPlayer,
					args.gamepass_id
				)
			} else {
				MarketplaceService.PromptProductPurchase(
					Players.LocalPlayer,
					args.gamepass_id
				)
			}
			let event =
				props.purchasable_type === "gamepass"
					? MarketplaceService.PromptGamePassPurchaseFinished
					: MarketplaceService.PromptProductPurchaseFinished
			let result = false
			if (__STUDIO__) {
				task.wait(1)
				result = true
			} else {
				const [_, __, new_result] = event.Wait()
				result = new_result
			}
			if (result) {
				UIHelper.playSound(A.sounds.purchase_success)
				refetchOwned()
			}
			return result
		},
		onError: (err) => {
			showError({
				title: "Purchase Failed",
				message: extractMessageFromError(err as string),
				onClose: () => {}
			})
		}
	})
	const thisRef = React.useRef<ImageButton>()
	if (isLoading) {
		return (
			<frame BackgroundTransparency={1}>
				<LoadingIndicator />
			</frame>
		)
	}
	if (!data) {
		return
	}
	return (
		<imagelabel Image={A.ui.frame} Size={UIDIM.ONE} BackgroundTransparency={1}>
			<uipadding
				PaddingTop={new UDim(0.02, 0)}
				PaddingBottom={new UDim(0.02, 0)}
				PaddingLeft={new UDim(0.02, 0)}
				PaddingRight={new UDim(0.02, 0)}
			/>
			<imagelabel
				Size={new UDim2(0.95, 0, 0.95, 0)}
				Position={UIDIM.CENTER}
				AnchorPoint={UIDIM.A_CENTER}
				Image={A.ui.corner}
				BackgroundColor3={new Color3(0, 0, 0)}
				BackgroundTransparency={1}
				ScaleType={Enum.ScaleType.Slice}
				SliceCenter={new Rect(new Vector2(200, 200), new Vector2(200, 200))}
				SliceScale={0.2}
				ImageColor3={new Color3(1, 1, 1)}
				ResampleMode={Enum.ResamplerMode.Default}
			/>
			<GoofyText
				AnchorPoint={UIDIM.A_TOP}
				Position={new UDim2(0.5, 0, 0, 0)}
				Text={`${data.Name}`}
				Size={new UDim2(0.5, 0, 0.1, 0)}
				ZIndex={2}
			/>
			<imagelabel
				Size={new UDim2(1, 0, 1, 0)}
				AnchorPoint={UIDIM.A_TOP}
				Position={new UDim2(0.25, 0, 0, 0)}
				BackgroundTransparency={1}
				Image={`rbxassetid://${data.IconImageAssetId}`}
			>
				<uiaspectratioconstraint AspectRatio={1} />
				<uicorner CornerRadius={new UDim(1, 0)} />
			</imagelabel>

			<GoofyText
				AnchorPoint={UIDIM.A_TOP_RIGHT}
				Text={`${data.Description}`}
				Size={new UDim2(0.5, 0, 0.85, 0)}
				Position={new UDim2(1, 0, 0.125, 0)}
				MaxTextSize={20}
				Thickness={0.05}
				TextXAlignment={Enum.TextXAlignment.Left}
				TextYAlignment={Enum.TextYAlignment.Top}
			/>

			<GoofyButton
				ref={thisRef}
				AnchorPoint={UIDIM.A_BOTTOM}
				Text={
					isPromptLoading
						? "processing..."
						: isOwned
							? "OWNED"
							: `\u{E002} ${data.PriceInRobux}`
				}
				Position={new UDim2(0.25, 0, 1.05, 0)}
				Size={new UDim2(0.6, 0, 0.27, 0)}
				Image={A.ui.button_horizontal}
				Color={
					isOwned || isPromptLoading
						? new Color3(0.43, 0.43, 0.43)
						: new Color3(0.37, 0.89, 0.17)
				}
				OnClick={() => {
					if (isOwnedLoading) {
						logger.warn("Ownership status still loading")
						return
					}
					if (isOwned || isPromptLoading) {
						UIHelper.playSound(A.sounds.error)
						return
					}
					promptPurchase({ gamepass_id: props.purchasable_id })
				}}
			>
				{ isOwned ? undefined :  <Sparkle />}
			</GoofyButton>
		</imagelabel>
	)
}
