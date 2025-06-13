import React, { useEffect, useState } from "react";
import { callGo } from "../../core";

const url = "https://github.com/Gowars/Lemon2";

export function AboutView() {
    const [info, set] = useState("");
    useEffect(() => {
        callGo("get-vray-info").then((res) => {
            set(res);
        });
    }, []);

    return (
        <div className="pp20 flex1 tc pt100">
            <img src="/logo.png" alt="" className="w100 h100 no-select" />
            <p className="mt20 fs16 mb20 b">
                <OpenLinkView url={url} text='Lemon2 V0.0.1' />
            </p>
            <div className="mt6">
                <span className="app-text-gray mr10">Feedback:</span>
                <OpenLinkView url={`${url}/issues`} />
            </div>
            <p
                className="mt10 mt6 fs12 plr10 app-text-gray"
                style={{ wordBreak: "keep-all" }}
            >
                {info}
            </p>
        </div>
    );
}

function OpenLinkView({ url, text }) {
    return (
        <span className="pointer" onClick={() => callGo("open-url", url)}>
            {text || url}
        </span>
    );
}
