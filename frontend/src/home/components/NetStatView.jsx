import React, { useEffect } from "react";
import { callGo } from "../core";
import { interval } from "../helper";
import { useBetterState } from "@/snake/useLib";
import { humanSize } from "@/lemon-tools/humanSize";

function geNetStat(output = "") {
    const line =
        output.split(/\n/).filter((i) => i.includes("v2ray-lemon2"))[0] || "";
    const [bytes_in, bytes_out] = line
        .split(/\s+/)
        .slice(-2)
        .map((i) => Number(i) || 0);
    return {
        bytes_in,
        bytes_out,
    };
}

export function NetStatView() {
    const { state, setState, stateRef } = useBetterState({
        list: [],
        code: "",
        speed: {
            per_in: "0",
            per_out: "0",
        },
    });
    useEffect(() => {
        return interval(
            () => {
                callGo("get-net-stats").then((code) => {
                    const info = geNetStat(code);
                    const prev = stateRef.current.list.slice(-1)[0];
                    const speed = { per_in: "0", per_out: "0" };
                    if (prev) {
                        speed.per_in = humanSize(
                            Math.max(info.bytes_in - prev.bytes_in, 0) || 0,
                        );
                        speed.per_out = humanSize(
                            Math.max(info.bytes_out - prev.bytes_out, 0) || 0,
                        );
                    }

                    setState({
                        code,
                        list: stateRef.current.list.concat(info).slice(-10),
                        speed,
                    });
                });
            },
            { time: 1000 },
        );
    }, []);

    return (
        <div className="fs11 ui-flex">
            <span className="flex1">🚀 {state.speed.per_out}</span>
            {/* <span className='flex1'>⬇️ {state.speed.per_out}</span> */}
        </div>
    );
}
