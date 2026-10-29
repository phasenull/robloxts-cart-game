import {
	MarketplaceService,
	Players,
	RunService,
	TweenService,
	Workspace,
} from "@rbxts/services";
import type { Trove } from "@rbxts/trove";
import { getConfig } from "shared/config.helper";
import { Logger } from "shared/common/logger";
import { network } from "shared/net";
import { MasslessPart, ProximityPrompt } from "shared/common/util.helper";
import { homePivot, rigOnce, TaggedComponent } from "shared/component";
import { PromptPurchaseSignal } from "client/ui/gui/suspense/product-purchasing";

const ANIMATE_DISTANCE = 100;

const WAVE_AMPLITUDE = 0.4;
const WAVE_DURATION = 1.5;
const WIND_TILT = 3; // degrees
const WIND_DURATION = 2.3; // offset from bob so they drift in/out of phase

const PROMPT_NAME = "PurchasePrompt";

/**
 * Tag "PurchaseComponent" (Model): a cart on display with a purchase prompt, bobbing while the player is near. The
 * Root part and prompt are world setup, handed over between generations; the animation and checks are per generation.
 */
export class PurchaseComponent extends TaggedComponent<Model> {
	private readonly logger = new Logger("purchase.component");
	private readonly prompt: ProximityPrompt;
	constructor(instance: Model, trove: Trove) {
		super(instance, trove);
		rigOnce(this.instance, "purchase", () => {
			this.instance.GetDescendants().forEach((descendant) => {
				if (descendant.IsA("BasePart")) {
					descendant.Anchored = true;
				}
			});
			const root = MasslessPart(this.instance, "Root");
			root.Anchored = true;
			root.Transparency = 1;
			root.CanCollide = false;
			root.Size = new Vector3(1, 1, 1);
			root.CFrame = this.instance.GetPivot();
			this.instance.PrimaryPart = root;
			const prompt = ProximityPrompt(root);
			prompt.Name = PROMPT_NAME;
			prompt.HoldDuration = 0;
			prompt.ActionText = "Purchase";
			prompt.ObjectText = this.instance.Name;
			prompt.RequiresLineOfSight = false;
		});
		const root = this.instance.FindFirstChild("Root") as BasePart;
		this.prompt = root.FindFirstChild(PROMPT_NAME) as ProximityPrompt;
		const product_id = findProductIdFromModel(this.instance);

		// Hide the prompt for a cart the player already owns (one shared query for every display cart: one request each
		// was a burst past the network rate limit, "Slow down!" at join)
		this.trove.add(task.spawn(() => {
			if (ownedCarts().expect().has(this.instance.Name)) this.prompt.Enabled = false;
		}));

		this.trove.connect(this.prompt.Triggered, async (player) => {
			if (player !== Players.LocalPlayer) return;
			if (!product_id) return;
			// Re-check ownership right before prompting to prevent double-purchase
			try {
				const [owned] = await network.client.ShopService.doesPlayerOwnItem.invoke(
					"cart",
					this.instance.Name,
				);
				if (owned === true) {
					this.prompt.Enabled = false;
					return;
				}
			} catch (err) {
				this.logger.warn(`Ownership check failed, prompting anyway: ${err}`);
			}
			PromptPurchaseSignal.Fire(true);
			MarketplaceService.PromptProductPurchase(player, product_id);
		});

		this.trove.connect(
			MarketplaceService.PromptProductPurchaseFinished,
			(_productId, _wasPurchased) => {
				if (_productId !== product_id) return;
				if (!_wasPurchased) return;
				// Immediately hide the prompt — server may not have processed the grant yet
				this.prompt.Enabled = false;
			},
		);

		// Wavy bob + wind tilt animation — randomised per instance so no two carts sync up
		const rng = new Random();
		const bobDuration = WAVE_DURATION + rng.NextNumber(-0.4, 0.4);
		const windDuration = WIND_DURATION + rng.NextNumber(-0.6, 0.6);
		const windSign = rng.NextNumber() > 0.5 ? 1 : -1; // randomise initial tilt direction

		const originalCFrame = homePivot(this.instance, "purchase");
		this.instance.PivotTo(originalCFrame);
		let bobValue = rng.NextNumber(0, 1); // random start phase
		let windValue = rng.NextNumber(0, 1);

		const updatePivot = () => {
			const tilt = math.rad((windValue * 2 - 1) * WIND_TILT * windSign);
			this.instance.PivotTo(
				originalCFrame
					.mul(new CFrame(0, bobValue * WAVE_AMPLITUDE, 0))
					.mul(CFrame.Angles(0, 0, tilt)),
			);
		};

		const wavyNum = this.trove.add(new Instance("NumberValue"));
		wavyNum.Value = bobValue;
		wavyNum.Name = "WavyAnimation";
		wavyNum.Parent = this.instance;
		this.trove.connect(wavyNum.Changed, (v) => {
			bobValue = v;
			updatePivot();
		});

		const bobTween = TweenService.Create(
			wavyNum,
			new TweenInfo(
				bobDuration,
				Enum.EasingStyle.Sine,
				Enum.EasingDirection.InOut,
				-1,
				true,
			),
			{ Value: bobValue > 0.5 ? 0 : 1 },
		);

		const windNum = this.trove.add(new Instance("NumberValue"));
		windNum.Value = windValue;
		windNum.Name = "WindAnimation";
		windNum.Parent = this.instance;
		this.trove.connect(windNum.Changed, (v) => {
			windValue = v;
			updatePivot();
		});

		const windTween = TweenService.Create(
			windNum,
			new TweenInfo(
				windDuration,
				Enum.EasingStyle.Sine,
				Enum.EasingDirection.InOut,
				-1,
				true,
			),
			{ Value: windValue > 0.5 ? 0 : 1 },
		);

		let animating = false;
		const camera = Workspace.CurrentCamera;
		this.trove.add(() => {
			bobTween.Cancel();
			windTween.Cancel();
		});
		this.trove.connect(RunService.Heartbeat, () => {
			const character = Players.LocalPlayer.Character;
			const rootPart = character?.FindFirstChild("HumanoidRootPart") as
				| BasePart
				| undefined;
			const position = this.instance.GetPivot().Position;

			const nearEnough =
				rootPart !== undefined &&
				rootPart.Position.sub(position).Magnitude <= ANIMATE_DISTANCE;
			const inViewport =
				camera !== undefined &&
				camera.WorldToViewportPoint(position)[1] === true;

			const shouldAnimate = nearEnough && inViewport;
			if (shouldAnimate && !animating) {
				animating = true;
				bobTween.Play();
				windTween.Play();
			} else if (!shouldAnimate && animating) {
				animating = false;
				bobTween.Pause();
				windTween.Pause();
			}
		});
	}
}
/** The carts the local player owns, asked once per generation (retried while the profile loads). Never rejects. */
let owned_carts: Promise<ReadonlySet<string>> | undefined;
function ownedCarts(): Promise<ReadonlySet<string>> {
	owned_carts ??= (async () => {
		for (let attempt = 0; attempt < 5; attempt++) {
			try {
				const [inventory] = await network.client.ShopService.getPlayerInventory.invoke("cart");
				// no inventory: the profile isn't loaded yet
				if (inventory) {
					return new Set((inventory.carts ?? []).map((entry) => entry.name)) as ReadonlySet<string>;
				}
			} catch {
				// rate limited or timed out: try again below
			}
			task.wait(2);
		}
		return new Set<string>() as ReadonlySet<string>;
	})();
	return owned_carts;
}
function findProductIdFromModel(model: Model): number | undefined {
	const config = getConfig();
	const products = config.PurchasableConfig.find(
		(p) =>
			!!p.rewards.find(
				(r) => (r.type as string) === "cart" && r.value === model.Name,
			),
	);
	const cart_config = config.CartConfig.find(
		(c) => c.name === model.Name,
	)?.product_id;
	return products?.product_id || cart_config;
}
