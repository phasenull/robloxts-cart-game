import { BaseRegistry, TransformResult, TypeBuilder } from "@rbxts/centurion";
import Object from "@rbxts/object-utils";
import { assets } from "./assets";
function buildEnumType(type_name:string, options:string[]) {
	const itemType = TypeBuilder.create<string>(type_name)
		.transform((text) => {
			if (!options) {
				return TransformResult.err(`${type_name} list is not loaded.`);
			}
			if (!(options.includes(text) || options.includes(clearQuotes(text)))) {
				return TransformResult.err(` "${clearQuotes(text)}" does not exist.`);
				// \nAvailable options: ${options.join(", ")}
			}
			return TransformResult.ok(text);
		})

		.suggestions(() => options ?? [])
		.build();
	return itemType;
}
function clearQuotes(str: string): string {
	// if string starts with quotes and ends with quotes, remove them
	if (str.sub(0, 1) === `"` && str.sub(str.size() - 1, str.size()) === `"`) {
		return str.sub(2, str.size() - 1);
	}
	return str;
}
export = async (registry: BaseRegistry) => {
	
	await registry.registerType(buildEnumType("__example", Object.keys({"hello":"world"})));
	await registry.registerType(buildEnumType("CartSkin", assets.carts.GetChildren().map((cart) => cart.Name)));
};
