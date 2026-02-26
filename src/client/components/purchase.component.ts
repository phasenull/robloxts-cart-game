import { BaseComponent, Component } from "@flamework/components";
import { MarketplaceService,
Players, RunService, TweenService, Workspace } from "@rbxts/services";
import { PromptPurchaseSignal } from "client/ui/gui/suspense/product-purchasing";
import { getConfig } from "shared/config.helper";
import { Logger } from "shared/logger";
import { ClientFunctions } from "shared/network.helper";
import { MasslessPart,
ProximityPrompt } from "shared/util.helper";

const ANIMATE_DISTANCE = 100;

const WAVE_AMPLITUDE = .4;
const WAVE_DURATION = 1.5;
const WIND_TILT = 3; // degrees
const WIND_DURATION = 2.3; // offset from bob so they drift in/out of phase

@Component({
	tag: "PurchaseComponent",
})
export class PurchaseComponent extends BaseComponent<{},Model> {
	private readonly prompt = ProximityPrompt(this.instance);
	constructor(private logger:Logger) {
		super();
        this.instance.GetDescendants().forEach((descendant) => {
            if (descendant.IsA("BasePart")) {
                descendant.Anchored = true;
            }
        })
        const root = MasslessPart(this.instance, "Root");
        root.Anchored = true;
        root.Transparency = 1;
        root.CanCollide = false;
        root.Size = new Vector3(1,1,1);
        root.CFrame = this.instance.GetPivot();
        this.instance.PrimaryPart = root;
        this.prompt.Parent = root;
		this.prompt.HoldDuration = 0;
		this.prompt.ActionText = "Purchase";
        this.prompt.Parent = root;
		this.prompt.ObjectText = this.instance.Name;
        this.prompt.RequiresLineOfSight = false;
        const product_id = findProductIdFromModel(this.instance)

		// Check ownership before allowing purchase prompt
		task.spawn(async () => {
			for (let i = 0; i < 5; i++) {
				const result = await ClientFunctions?.ShopService.doesPlayerOwnItem.invoke("cart", this.instance.Name);
				// result[1] being set means an error occurred (e.g. profile not loaded yet), retry
				if (result && result[1] !== undefined) {
					task.wait(2);
					continue;
				}
				if (result && result[0] === true) {
					this.prompt.Enabled = false;
				}
				break;
			}
		});

		this.prompt.Triggered.Connect(async (player) => {
			if (player !== Players.LocalPlayer) return;
			if (!product_id) return;
			// Re-check ownership right before prompting to prevent double-purchase
			const result = await ClientFunctions?.ShopService.doesPlayerOwnItem.invoke("cart", this.instance.Name);
			if (result && result[0] === true) {
				this.prompt.Enabled = false;
				return;
			}
			PromptPurchaseSignal.Fire(true);
			MarketplaceService.PromptProductPurchase(player, product_id);
		});

		MarketplaceService.PromptProductPurchaseFinished.Connect((_productId, _wasPurchased) => {
			if (_productId !== product_id) return;
			if (!_wasPurchased) return;
			// Immediately hide the prompt — server may not have processed the grant yet
			this.prompt.Enabled = false;
		});

		// Wavy bob + wind tilt animation — randomised per instance so no two carts sync up
		const rng = new Random();
		const bobDuration = WAVE_DURATION + rng.NextNumber(-0.4, 0.4);
		const windDuration = WIND_DURATION + rng.NextNumber(-0.6, 0.6);
		const windSign = rng.NextNumber() > 0.5 ? 1 : -1; // randomise initial tilt direction

		const originalCFrame = this.instance.GetPivot();
		let bobValue = rng.NextNumber(0, 1); // random start phase
		let windValue = rng.NextNumber(0, 1);

		const updatePivot = () => {
			const tilt = math.rad((windValue * 2 - 1) * WIND_TILT * windSign);
			this.instance.PivotTo(
				originalCFrame.mul(new CFrame(0, bobValue * WAVE_AMPLITUDE, 0)).mul(CFrame.Angles(0, 0, tilt)),
			);
		};

		const wavyNum = new Instance("NumberValue");
		wavyNum.Value = bobValue;
		wavyNum.Name = "WavyAnimation";
		wavyNum.Parent = this.instance;
		wavyNum.Changed.Connect((v) => { bobValue = v; updatePivot(); });

		const bobTween = TweenService.Create(wavyNum, new TweenInfo(
			bobDuration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true,
		), { Value: bobValue > 0.5 ? 0 : 1 });

		const windNum = new Instance("NumberValue");
		windNum.Value = windValue;
		windNum.Name = "WindAnimation";
		windNum.Parent = this.instance;
		windNum.Changed.Connect((v) => { windValue = v; updatePivot(); });

		const windTween = TweenService.Create(windNum, new TweenInfo(
			windDuration, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true,
		), { Value: windValue > 0.5 ? 0 : 1 });

		let animating = false;
		const camera = Workspace.CurrentCamera;
		RunService.Heartbeat.Connect(() => {
			const character = Players.LocalPlayer.Character;
			const rootPart = character?.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
			const position = this.instance.GetPivot().Position;

			const nearEnough = rootPart !== undefined &&
				rootPart.Position.sub(position).Magnitude <= ANIMATE_DISTANCE;
			const inViewport = camera !== undefined &&
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
function findProductIdFromModel(model: Model): number | undefined {
	const config = getConfig();
	const products = config.PurchasableConfig.find((p) =>
		!!p.rewards.find((r) => (r.type as string) === "cart" && r.value === model.Name),
	);
    const cart_config = config.CartConfig.find(c => c.name === model.Name)?.product_id
	return products?.product_id || cart_config;
}
