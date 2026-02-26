import { BaseComponent, Component } from "@flamework/components";
import { MarketplaceService,
Players } from "@rbxts/services";
import { PromptPurchaseSignal } from "client/ui/gui/suspense/product-purchasing";
import { getConfig } from "shared/config.helper";
import { Logger } from "shared/logger";
import { MasslessPart,
ProximityPrompt } from "shared/util.helper";

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
		this.prompt.Triggered.Connect((player) => {
			if (player !== Players.LocalPlayer) return;
            if (!product_id) {return}
            PromptPurchaseSignal.Fire(true);
            MarketplaceService.PromptProductPurchase(player, product_id);
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
