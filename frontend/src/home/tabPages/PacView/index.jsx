import React, { useEffect } from "react";

import { callGo } from "@/src/home/core.js";
import { CodeBlockView } from "@/src/home/components/CodeBlockView";
import { useBetterState } from "@/snake/useLib/index.jsx";
import { useAppState } from "@/src/store/index.js";

export function PacView() {
    const { state, setState } = useBetterState({
        code: "\n\n\n\n",
    });
    const { pacPort } = useAppState();

    useEffect(() => {
        callGo("get-pac-content").then((res) => {
            setState({
                code: res,
            });
        });
    }, []);

    return (
        <CodeBlockView
            code={state.code}
            language="javascript"
            theme="themeFull"
            url={"http://127.0.0.1:" + pacPort + "/proxy.js"}
        />
    );
}
