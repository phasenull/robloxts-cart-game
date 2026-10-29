import { Players } from "@rbxts/services";
import { Controller, Module, type OnStart } from "@typetorch/framework";

@Controller()
export class CharController extends Module implements OnStart {
	onStart(): void {
		const player = Players.LocalPlayer;
		this.trove.connect(player.CharacterAdded, (char) => {
			this.onCharAdded(char);
		});
	}
	onCharAdded(char: Model) {}
}
