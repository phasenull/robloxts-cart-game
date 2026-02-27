import { Component, Components } from "@flamework/components";
import { Dependency } from "@flamework/core";
import { Players, RunService } from "@rbxts/services";
import type { CartServerComponent } from "server/components/cart.server.component";
import type { DataService } from "server/services/data.service";
import {
	BuildDeepWeldConstraints,
	BuildWeldConstraints,
} from "@common/shared/util.helper";
import { CartTouch } from "./cart-touch.component";
import { CashPopupSignal } from "@common/shared/cash-popup.signal";
import { assets } from "@common/shared/assets";
import { Children } from "@rbxts/react";
import { Logger } from "@common/shared/logger";
import { __IS_CLIENT__ } from "@common/shared/config.builder";
import { ClientEvents, ServerEvents } from "shared/network.helper";

@Component({ tag: "CashComponent" })
export class CashComponent extends CartTouch<
	Model & {
		Trigger: BasePart;
	}
> {
	// keyed by UserId to avoid Player reference issues
	private readonly debounce: Map<number, number> = new Map();
	private readonly DEBOUNCE_DURATION = 300;
	private readonly CASH_AMOUNT = 50;
	private client_collected = false;

	constructor(private logger: Logger) {
		super();
		this.touch_part.Anchored = true;

		if (!__IS_CLIENT__) {
			return;
		}
		ClientEvents.CashService.cashCollected.connect((position) => {
			if (this.touch_part.Position.sub(position).Magnitude > 1) return;
			this.onClientTouch();
		});
		const cloned = assets.CashVisuals.Clone();
		cloned.PivotTo(this.instance.GetPivot());
		cloned.Parent = this.instance;
		cloned.Name = "Visuals";
		const visuals = cloned;
		for (const d of visuals.GetDescendants()) {
			if (!d.IsA("BasePart")) continue;
			d.Massless = true;
			d.CanCollide = false;
		}
		const root =
			visuals.PrimaryPart ??
			visuals.FindFirstChildWhichIsA("BasePart") ??
			visuals.FindFirstChildWhichIsA("MeshPart");
		assert(root, "Visuals must have a BasePart or MeshPart as a root");
		BuildDeepWeldConstraints(root, visuals);
		// Weld the Visuals root to the Trigger so moving Trigger moves everything
		BuildWeldConstraints(this.touch_part, root);
		this.touch_part.Transparency = 1;
	}

	override onTouch(other_part: BasePart, cart_model: Model): void {
		if (RunService.IsServer()) {
			this.onServerTouch(other_part, cart_model);
		}
	}

	private onServerTouch(_other_part: BasePart, cart_model: Model): void {
		const cart_component =
			Dependency<Components>().getComponent<CartServerComponent>(cart_model);
		if (!cart_component) {
			return;
		}
		const player = cart_component.resolvePlayer();
		if (!player) {
			return;
		}
		const now = tick();
		const last = this.debounce.get(player.UserId) ?? -this.DEBOUNCE_DURATION;
		const remaining = this.DEBOUNCE_DURATION - (now - last);
		if (remaining > 0) {
			return;
		}
		this.logger.log(`[CashComponent] Granting $${this.CASH_AMOUNT} to ${player.Name} from ${this.instance.Name}`);
		this.debounce.set(player.UserId, now);
		Dependency<DataService>().grantPlayerCash(
			player,
			this.CASH_AMOUNT,
			"Cash Pickup",
			undefined,
			true,
		);
		ServerEvents.CashService.cashCollected.fire(player, this.touch_part.Position);
	}

	private onClientTouch(): void {
		if (this.client_collected) return;
		this.client_collected = true;

		const primary_part = Players.LocalPlayer.Character?.PrimaryPart;
		if (!primary_part) return;

		const clone = this.instance.Clone();
		clone.RemoveTag("CashComponent");
		clone.Parent = this.instance.Parent;

		const start_pos = this.touch_part.Position;

		// Hide original visuals by making parts fully transparent
		const visuals = this.instance.FindFirstChild("Visuals") as
			| Model
			| undefined;
		const visual_parts = (visuals
			?.GetDescendants()
			.filter((d) => d.IsA("BasePart")) ?? []) as BasePart[];
		for (const part of visual_parts) part.Transparency = 1;

		// Get clone parts for fade
		const clone_visuals = clone.FindFirstChild("Visuals") as Model | undefined;
		const clone_parts = (clone_visuals
			?.GetDescendants()
			.filter((d) => d.IsA("BasePart")) ?? []) as BasePart[];
		const original_transparencies = clone_parts.map((p) => p.Transparency);

		const DURATION = 0.5;
		const start = tick();

		const conn = RunService.Heartbeat.Connect(() => {
			const alpha = math.min((tick() - start) / DURATION, 1);
			const end_pos = primary_part.Position;
			clone.PivotTo(new CFrame(start_pos.Lerp(end_pos, alpha)));
			// Fade out clone parts
			for (let i = 0; i < clone_parts.size(); i++) {
				clone_parts[i].Transparency = math.lerp(
					original_transparencies[i],
					1,
					alpha,
				);
			}
			if (alpha >= 1) {
				clone.Destroy();
				conn.Disconnect();
			}
		});
		CashPopupSignal.Fire(this.touch_part.Position);
		task.spawn(() => {
			task.wait(this.DEBOUNCE_DURATION);
			this.client_collected = false;
			const current_visuals = this.instance.FindFirstChild("Visuals") as
				| Model
				| undefined;
			if (!current_visuals) return;
			for (const d of current_visuals.GetDescendants()) {
				if (d.IsA("BasePart")) d.Transparency = 0;
			}
		});
	}
}

export { CashPopupSignal } from "@common/shared/cash-popup.signal";
