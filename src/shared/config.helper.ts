import { buildConfigGetter } from "shared/common/config.builder";
import { IConfig } from "./type.helper";

export function getConfig() {
	return buildConfigGetter<IConfig>();
}
