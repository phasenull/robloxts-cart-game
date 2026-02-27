import { buildConfigGetter } from "@common/shared/config.builder";
import { IConfig } from "./type.helper";

export function getConfig() {
	return buildConfigGetter<IConfig>();
}
