import { copyToClipboard } from "@/lemon-tools/copyToClipboard";
import { Modal } from "@/snake/main";
import { useAppState } from "@/src/store";
import React, { useEffect, useState } from "react";
import { interval } from "@/src/home/helper";
import { callGo } from "@/src/home/core";
import { CodeBlockView } from "@/src/home/components/CodeBlockView";
import { language } from "@/src/i18n";

export function CopyProxyView() {
    const appState = useAppState();
    const [localIP, update] = useState("");
    const copyShell = (event) => {
        console.log(event);
        copyToClipboard(event.target.textContent);
        Modal.success("Copy Success");
    };

    useEffect(() => {
        return interval(
            () => {
                callGo("get-local-ip").then((res) => {
                    update(res);
                });
            },
            { time: 10 * 1000, imme: true },
        );
    }, []);

    return (
        <div className="pp30 fs12 lh20 flex1">
            <FieldView title={language.UseTheCurrentDeviceTerminal}>
                <CodeBlockView
                    language="bash"
                    onClick={copyShell}
                    code={[
                        `export http_proxy=http://127.0.0.1:${appState.httpPort};`,
                        `export https_proxy=http://127.0.0.1:${appState.httpPort};`,
                        `export ALL_PROXY=socks5://127.0.0.1:${appState.socksPort};`,
                    ].join("\n")}
                />
            </FieldView>
            <FieldView title={language.AddHTTPProxyInTheCurrentDeviceApp}>
                <CodeBlockView
                    language="bash"
                    code={`127.0.0.1:${appState.httpPort}`}
                    className="pointer"
                />
            </FieldView>
            <FieldView title={language.AddSocketProxyInTheCurrentDeviceApp}>
                <CodeBlockView
                    language="bash"
                    code={`127.0.0.1:${appState.socksPort}`}
                    className="pointer"
                />
            </FieldView>
            <FieldView title={language.AddPacInTheCurrentDeviceApp}>
                <CodeBlockView
                    language="bash"
                    code={`http://127.0.0.1:${appState.pacPort}/proxy.js`}
                    className="pointer"
                />
            </FieldView>
            <FieldView title={language.UseOtherDevicesInTheSameWifiTerminal}>
                <CodeBlockView
                    language="bash"
                    onClick={copyShell}
                    className="pointer"
                    code={[
                        `export http_proxy=http://${localIP}:${appState.httpPort};`,
                        `export https_proxy=http://${localIP}:${appState.httpPort};`,
                        `export ALL_PROXY=socks5://${localIP}:${appState.socksPort};`,
                    ].join("\n")}
                />
            </FieldView>
            <FieldView
                title={language.AddHTTPProxyInOtherDevicesInTheSameWifiApp}
            >
                <CodeBlockView
                    language="bash"
                    className="pointer"
                    code={`${localIP}:${appState.httpPort}`}
                />
            </FieldView>
            <FieldView
                title={language.AddSocketProxyInOtherDevicesInTheSameWifiApp}
            >
                <CodeBlockView
                    language="bash"
                    className="pointer"
                    code={`${localIP}:${appState.socksPort}`}
                />
            </FieldView>
            <FieldView title={language.AddPacInOtherDevicesInTheSameWifi}>
                <CodeBlockView
                    language="bash"
                    code={`http://${localIP}:${appState.pacPort}/proxy.remote.js`}
                    className="pointer"
                />
            </FieldView>
            <div className="h40"></div>
        </div>
    );
}

function FieldView({ title = "", children }) {
    return (
        <div className="mb20">
            <p className="app-text-gray b mb6">{title}</p>
            <div className="pointer">{children}</div>
        </div>
    );
}
