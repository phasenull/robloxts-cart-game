import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { Logger } from "shared/logger";

@Controller()
export class CharController  implements OnStart{
	constructor(private logger: Logger) {}
    onStart(): void {
        const player = Players.LocalPlayer
        player.CharacterAdded.Connect((char) => {
            this.onCharAdded(char)
        })
    }
    onCharAdded(char: Model) {

    }
}
