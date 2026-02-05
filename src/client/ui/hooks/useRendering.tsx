import React from "@rbxts/react";
import { RunService } from "@rbxts/services";

export function useRendering() {
    const [time, setTime] = React.useState(tick());
    React.useEffect(() => {
        const conn = RunService.RenderStepped.Connect(() => {
            setTime(tick());
        });
        return () => {
            conn.Disconnect();
        };
    }, []);
    return time;
}
export function useRadians() {
    const [time, setTime] = React.useState(tick());
    React.useEffect(() => {
        const conn = RunService.RenderStepped.Connect(() => {
            setTime(tick());
        });
        return () => {
            conn.Disconnect();
        };
    }, []);
    return math.rad(time);
}