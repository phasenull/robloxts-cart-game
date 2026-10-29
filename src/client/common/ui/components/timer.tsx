import React, { useState } from "@rbxts/react";
import { useRendering } from "../hooks/useRendering";
import { GoofyText } from "./goofy-text";

export function Timer() {
	const [start_time, setStartTime] = useState<number>(tick());
	const time = useRendering()
	const elapsed = time - start_time;
	const minutes = math.floor(elapsed / 60);
	const seconds = math.floor(elapsed % 60);
	const mseconds = math.floor((elapsed - math.floor(elapsed)) * 1000);
	const formatted_time = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${mseconds < 100 ? mseconds < 10 ? "00" : "0" : ""}${mseconds}`;
	return <GoofyText  Text={formatted_time} />;
}