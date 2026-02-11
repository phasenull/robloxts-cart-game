import { Dependency } from "@flamework/core"
import React, { useEffect } from "@rbxts/react"
import { useMutation } from "@rbxts/react-query"
import { MarketplaceService, Players } from "@rbxts/services"
import { CartController } from "client/controllers/cart.controller"
import { UIHelper } from "client/ui.helper"
import { RottenButton } from "client/ui/components/buttons/rotten-button"
import { GoofyText } from "client/ui/components/goofy-text"
import { RadialProgress } from "client/ui/components/radial-progress"
import { REVIVE_TIME, UIDIM } from "client/ui/constants"
import { useCart } from "client/ui/contexts/cart.context"
import { __IS_EDIT__, __IS_STUDIO__ } from "shared/config.helper"
import { ClientFunctions } from "shared/network.helper"
import { useCheckpoint } from "../hooks/useCheckpoint"
import Object from "@rbxts/object-utils"
import { PRODUCTS } from "shared/purchasables"
import Signal from "@rbxts/signal"

interface DeathButtonsProps {
	transparency: number
}

export function DeathButtons({
	// shouldShow,
	transparency
}: DeathButtonsProps) {
	const { changeState, confirmHardReset, spawnPoint, state, products } =
		useCart()
	const shouldShow = state === "death_screen" || state === "reviving"
	const checkpoint = useCheckpoint().currentCheckpoint
	const { mutate: mutateRevive } = useMutation({
		queryKey: [`death-revive-${Object.keys(products).map((e)=>`${e}-${products.get(e)}`).join("-")}`],
		mutationFn: async () => {
			const revive_amount = products.get("revives") || 0
			print("revives:", revive_amount)
			if (revive_amount <= 0) {
				const purchase_resulted = new Signal<(status:boolean)=>void>()
				MarketplaceService.PromptProductPurchase(Players.LocalPlayer, PRODUCTS.revives)
				const result = await MarketplaceService.PromptProductPurchaseFinished.Connect((uid,pid,ip)=>{
					if (uid !== Players.LocalPlayer.UserId) {
						return
					}
					if (pid !== PRODUCTS.revives) {
						return
					}
					purchase_resulted.Fire(ip)
				})
				purchase_resulted.Wait()
			}
			const controller = Dependency<CartController>()
			changeState("reviving")
			UIHelper.toggleFade(true)
			task.wait(0.5)
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
			UIHelper.toggleFade(true)
			task.wait(0.5)
			changeState("none")
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
		<imagelabel
			Size={UDim2.fromScale(0.2, 0.2)}
			AnchorPoint={UIDIM.A_BOTTOM}
			Position={UDim2.fromScale(0.5, 0.95 + 1 - transparency)}
			BackgroundTransparency={1}
		>
			<uiaspectratioconstraint AspectRatio={4} />
			<uilistlayout
				Padding={new UDim(0.3, 0)}
				FillDirection={Enum.FillDirection.Horizontal}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>
			<RottenButton
				Size={UIDIM.ONE}
				onClick={mutateHardReset}
				Text="RESET"
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
				onClick={mutateRevive}
				Color={new Color3(0.09, 0.86, 0.09)}
				Size={UIDIM.ONE.add(UDim2.fromScale(0.5, 0.5))}
				Text={`REVIVE (${products.get("revives") || 0}x)`}
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
	)
}
