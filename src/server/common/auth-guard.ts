import { CommandGuard } from "@rbxts/centurion";
import { RunService } from "@rbxts/services";

export function isAdmin(user_id: number): boolean {
	return [409950512].includes(user_id);
}
export const adminGuard: CommandGuard = (ctx) => {
	if (isAdmin(ctx.executor.UserId)) {
		return true;
	}
	if (RunService.IsStudio()) {
		return true;
	}
	ctx.error("You do not have permission to use this command.");
	return false;
};
