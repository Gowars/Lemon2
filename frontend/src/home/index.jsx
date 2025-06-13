import {
    dispatchApp,
    getAppState,
    resetAppState,
    setAppState,
    useAppState,
} from "@/src/store";
import { useBetterState } from "@/snake/useLib/index.jsx";
import React, { useEffect } from "react";

import S from "./index.module.scss";
import cx from "@/lemon-tools/cx";
import { callGo } from "./core.js";
import {
    createQRCode,
    getSelectNodeConfig,
    restartServer,
    showSelectedSever,
    updateGFW,
} from "./service";
import { interval, safeParse, sleep } from "./helper";
import { ServerView } from "./tabPages/ServerView";
import { ConfigureView } from "./tabPages/ConfigureView";
import { CodeBlockView } from "./components/CodeBlockView";
import { CopyProxyView } from "./tabPages/CopProxyView";
import { AppRouteMannagerView, LogView } from "./tabPages/LogView";
import { AboutView } from "./tabPages/AboutView";
import { SwitchMulti } from "./components/SwitchMulti";
import { PacView } from "./tabPages/PacView";
import { NetStatView } from "./components/NetStatView";
import { language } from "../i18n";
import { Events } from "@wailsio/runtime";
import { Modal } from "@/snake/main";

const TabEnmu = {
    CONFIG: "CONFIG",
    V2RAY: "V2RAY",
    SERVER: "SERVER",
    MANUAL: "MANUAL",
    PacView: "PacView",
    CopyProxy: "CopyProxy",
    ABOUT: "ABOUT",
    Log: "Log",
    AppNetwork: "AppNetwork",
    ShareQR: "ShareQR",
};

const tabs = [
    { name: `🍋 ${language.Servers}`, id: TabEnmu.SERVER, View: ServerView },
    { name: `🛠️ ${language.Configure}`, id: TabEnmu.CONFIG, View: ConfigureView },
    { name: `🍪 ${language.AppNetwork}`, id: TabEnmu.AppNetwork, View: AppRouteMannagerView },
    {
        name: `📖 ${language.ViewV2rayConfig}`,
        id: TabEnmu.V2RAY,
        View: () => {
            const appState = useAppState();
            return (
                <CodeBlockView
                    theme="themeFull"
                    code={appState.config || "\n\n\n\n"}
                />
            );
        },
    },
    { name: `🛞 ${language.ViewPacScript}`, id: TabEnmu.PacView, View: PacView },
    { name: `🍒 ${language.CopyProxy}`, id: TabEnmu.CopyProxy, View: CopyProxyView },
    { name: `📱 ${language.ShareQRCode}`, id: TabEnmu.ShareQR },
    { name: `📋 ${language.Log}`, id: TabEnmu.Log, View: LogView },
    { name: `✌️ ${language.About}`, id: TabEnmu.ABOUT, View: AboutView },
];

const pacTabs = [
    {
        value: "global",
        text: language.Global,
        desc: language.IgnorePacRulesAndForceProxyMode,
    },
    {
        value: "proxy",
        text: language.Proxy,
        desc: language.PacUsesProxyByDefaultSetPacDirectRulesToSpecifyDomainsThatDoNotUseProxy,
    },
    {
        value: "direct",
        text: language.Direct,
        desc: language.PacDoesNotUseProxyByDefaultSetPacProxyRulesToSpecifyDomainsThatUseProxy,
    },
    { value: "off", text: language.Off, desc: language.DisableProxy },
];

export function Page() {
    const appState = useAppState();
    const { state, setState } = useBetterState({ tab: tabs[0].id });

    const handlePacToggle = (v) => {
        setAppState({ pacMode: v });
    };

    useEffect(() => {
        callGo("get-front-config").then((res) => {
            const state = safeParse(res);
            if (state) {
                setAppState(state);
            } else {
                resetAppState();
            }
            callGo("get-system-info").then((res) => {
                setAppState(JSON.parse(res));
            });
            dispatchApp({ type: "getConfig" });
        });

        // 定时check v2ray是否还在运行，如果挂了就自动启动
        return interval(
            () => {
                callGo("check-is-run").then((result) => {
                    const { pacMode } = getAppState();
                    if (!result) {
                        callGo(pacMode);
                    }
                });
            },
            { time: 10 * 1000 },
        );
    }, []);

    useEffect(() => {
        return Events.On("lsof:error", (res) => {
            Modal.fail(
                language.StartupFailedThePortIsOccupied + ": " + res.data[0],
            );
        });
    }, []);

    useEffect(() => {
        restartServer();
        updateGFW(appState.gfwUrl);
    }, [appState.pacMode]);

    const handleTabChange = (tab) => () => {
        if (tab == TabEnmu.ShareQR) {
            createQRCode();
            return;
        }
        setState({ tab });
        if (tab == TabEnmu.CONFIG) {
            dispatchApp({ type: "getConfig" });
        }
    };
    const handleLogoClick = async () => {
        // 切换节点tab，并自动定位到当前节点
        if (state.tab !== TabEnmu.SERVER) {
            handleTabChange(TabEnmu.SERVER)();
            await sleep(80); // wait dom updated
        }
        showSelectedSever();
    };

    const Ele = tabs.find((i) => i.id == state.tab)?.View;

    return (
        <div className={S.app}>
            <div className={cx(S.sidebar, "no-select")}>
                <div className="flex-cc tc mt10">
                    <span
                        className={cx("fs12 b pointer")}
                        onClick={handleLogoClick}
                    >
                        {getSelectNodeConfig(appState.tag)?.ps?.trim() ||
                            "Unkown"}
                    </span>
                    {/* <div style={{ flexShrink: '0' }}>
                  <SwitchCore value={appState.on} onChange={handleToggle} />
              </div> */}
                </div>
                <div className="mb20 mt15 fs12">
                    <SwitchMulti
                        data={pacTabs}
                        value={appState.pacMode}
                        onChange={handlePacToggle}
                    />
                </div>
                <div>
                    {tabs.map((i) => {
                        return (
                            <div
                                className={cx(
                                    S.sidebarItem,
                                    i.id == state.tab && S.active,
                                    'ui-flex-a'
                                )}
                                key={i.id}
                                onClick={handleTabChange(i.id)}
                            >
                                <span className="fs16 mr4">{i.name.slice(0,2)}</span>
                                <span>{i.name.slice(2)}</span>
                            </div>
                        );
                    })}
                </div>
                <div className={S.bottomPannel}>
                    <NetStatView />
                </div>
            </div>
            <div
                className="flex1 ui-flex no-scrollbar"
                style={{ height: "100vh" }}
            >
                {!!Ele && <Ele />}
            </div>
        </div>
    );
}
