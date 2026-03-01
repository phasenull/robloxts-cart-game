import { Dependency } from "@flamework/core"
import React, { useEffect, useRef, useState } from "@rbxts/react"
import { useMutation, useQuery } from "@rbxts/react-query"
import { MarketplaceService, Players } from "@rbxts/services"
import { promptGroupJoin } from "client/group-prompt"
import { CartController } from "client/controllers/cart.controller"
import { REVIVE_TIME, UIDIM } from "@common/client/ui/constants"
import { useCart } from "client/ui/contexts/cart.context"
import { ClientFunctions } from "shared/network.helper"
import { useCheckpoint } from "../hooks/useCheckpoint"
import Object from "@rbxts/object-utils"
import { PRODUCTS } from "shared/purchasables"
import Signal from "@rbxts/signal"
import { UIHelper } from "@common/client/ui.helper";
import { __IS_EDIT__ } from "@common/shared/config.builder";
import { RadialProgress } from "@common/client/ui/components/radial-progress";
import { RottenButton } from "@common/client/ui/components/buttons/rotten-button";
import { GoofyText } from "@common/client/ui/components/goofy-text";
import { ConfirmationPopup } from "@common/client/ui/components/confirmation-popup";
import { useNavigator } from "@common/client/ui/hooks/useNavigator";


interface DeathButtonsProps {
	transparency: number
	isPreviewLoading?: boolean
}

export function DeathButtons({
	// shouldShow,
	transparency,
	isPreviewLoading = false
}: DeathButtonsProps) {
	const { cart, changeState, confirmHardReset, spawnPoint, state, products, deathsAtCheckpoint, resetDeathsAtCheckpoint } =
		useCart()
	const shouldShow = (state === "death_screen" || state === "reviving") && !cart
	const checkpoint = useCheckpoint().currentCheckpoint
	const navigator = useNavigator()
	const [showCartPopup, setShowCartPopup] = useState(false)
	const lastPopupShownAt = useRef(-math.huge)

	const tryShowCartPopup = () => {
		const now = os.clock()
		if (now - lastPopupShownAt.current < 30) return
		lastPopupShownAt.current = now
		setShowCartPopup(true)
	}

	// Show "try a new cart" popup after 5 deaths at the same checkpoint, only if on default "Cart"
	const equippedCartName = useQuery({
		queryKey: ["player-preference", "cart"],
		queryFn: async () => {
			const [prefs] = await ClientFunctions.CustomizationService.getPlayerPreference.invoke("cart")
			if (!prefs) return "Cart"
			return prefs[0] ?? "Cart"
		},
	}).data ?? "Cart"

	useEffect(() => {
		if (deathsAtCheckpoint >= 3 && equippedCartName === "Cart") {
			tryShowCartPopup()
		}
	}, [deathsAtCheckpoint])

	const { mutate: mutateRevive,isLoading } = useMutation({
		queryKey: [
			`death-revive-${Object.keys(products)
				.map((e) => `${e}-${products.get(e)}`)
				.join("-")}`
		],
		mutationFn: async () => {
			const controller = Dependency<CartController>()
			let startedPurchaseFlow = false

			let revive_amount = products.get("revives") || 0
			if (revive_amount <= 0) {
				// Check if there's already a pending purchase
				if (!controller.tryStartPurchaseFlow()) {
					warn("Purchase already in progress, ignoring duplicate request")
					return false
				}
				startedPurchaseFlow = true

				try {
					const purchase_resulted = new Signal<(status: boolean) => void>()
					MarketplaceService.PromptProductPurchase(
						Players.LocalPlayer,
						PRODUCTS.revives
					)
					const conn =
						await MarketplaceService.PromptProductPurchaseFinished.Connect(
							(uid, pid, ip) => {
								if (uid !== Players.LocalPlayer.UserId) {
									return
								}
								if (pid !== PRODUCTS.revives) {
									return
								}
								conn.Disconnect()
								purchase_resulted.Fire(ip)
							}
						)
					const purchased = await purchase_resulted.Wait()
					if (!purchased) {
						warn("Purchase was canceled by user")
						return false
					}
					revive_amount += 1
				} finally {
					if (startedPurchaseFlow) {
						controller.finishPurchaseFlow()
					}
				}
			}
			if (revive_amount <= 0) {
				warn("No revives available, cannot revive")
				return false
			}
			
			// Only switch to reviving state after confirming we have revives
			UIHelper.toggleFade(true)
			task.wait(0.5)
			changeState("reviving")
			const [result, err] = await controller.promptRevive(checkpoint)
			UIHelper.toggleFade(false)
			if (!result || err) {
				throw `${err}`
			}
			return result
		},
		onError: (err) => {
			warn(`Failed to revive player: ${err}`)
		}
	})

	const { mutate: mutateHardReset } = useMutation({
		queryKey: ["death-reset"],

		mutationFn: async () => {
			if (!spawnPoint) {
				warn("No spawn point set for death screen")
				return false
			}
			promptGroupJoin()
			UIHelper.toggleFade(true)
			task.wait(0.5)
			confirmHardReset()
			UIHelper.toggleFade(false)
			if (__IS_EDIT__) return true
			try {
				await ClientFunctions.CartService.reset.invokeWithTimeout(5000)
				return true
			} catch (err) {
				warn(`Failed to respawn player: ${err}`)

				return false
			}
		}
	})
	useEffect(() => {
		if (!shouldShow) {
			return
		}
		const job = task.delay(REVIVE_TIME, () => {
			if (shouldShow) {
				mutateHardReset()
			}
		})
		return () => {
			task.cancel(job)
		}
	}, [shouldShow])
	if (!shouldShow) {
		return
	}
	return (
		<>
		<ConfirmationPopup
			visible={showCartPopup}
			title="Hey!"
			message="You've died here a lot. Want to try a better cart?"
			confirmText="Sure!"
			cancelText="No"
			onConfirm={() => {
				setShowCartPopup(false)
				resetDeathsAtCheckpoint()
				confirmHardReset()
				navigator.setOpenGui("carts")
			}}
			onCancel={() => {
				setShowCartPopup(false)
				resetDeathsAtCheckpoint()
			}}
		/>
		<imagelabel
			Size={UDim2.fromScale(0.2, 0.2)}
			AnchorPoint={UIDIM.A_BOTTOM}
			Position={UDim2.fromScale(0.5, 0.95 + 1 - transparency)}
			BackgroundTransparency={1}
		>
			<uiaspectratioconstraint AspectRatio={4} />
			<uilistlayout
				Padding={new UDim(0.2, 0)}
				FillDirection={Enum.FillDirection.Horizontal}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>
			<RottenButton
				Size={UIDIM.ONE}
				onClick={() => !isPreviewLoading && mutateHardReset()}
				Text={isPreviewLoading ? "LOADING..." : "SPAWN"}
				action="CONFIRM_RESET"
			>
				<GoofyText
					MinTextSize={1}
					Size={UDim2.fromScale(1, 0.3)}
					Position={UIDIM.BOTTOM_CENTER}
					AnchorPoint={UIDIM.A_TOP.add(new Vector2(0, 0.1))}
					Text={"(last checkpoint)"}
				></GoofyText>
			</RottenButton>
			<RottenButton
				onClick={()=> !isLoading && mutateRevive()}
				Color={new Color3(0.09, 0.86, 0.09)}
				Size={UIDIM.ONE.add(UDim2.fromScale(0.5, 0.5))}
				// Text={`REVIVE (${products.get("revives") || 0}x)`}
				Text={`REVIVE`}
				Ratio={1.5}
				action="REVIVE"
			>
				<RadialProgress
					degrees_per_second={360 / REVIVE_TIME}
					progress={1}
					initial_progress={0}
					Color={new Color3(1, 0.36, 0.36)}
					Size={UDim2.fromScale(0.5, 0.5)}
					Position={UDim2.fromScale(0, 0)}
					AnchorPoint={UIDIM.A_CENTER}

					// initial_progress={1}
				/>
			</RottenButton>
		</imagelabel>
		</>
	)
}
