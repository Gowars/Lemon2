import { clone } from "@/lemon-tools/clone";
import { baseVmess, createVmess, safeParse } from "./helper";
import { getAppState, setAppState } from "../store";
import { callGo, emitGoEvent, getServers } from "./core";
import { Modal } from "@/snake/main";
import React from "react";
import { Qrcode } from "@/snake/UI/Qrcode";
import { Events } from "@wailsio/runtime";
import { addQuery } from "@/lemon-tools/url";
import RX from "@/lemon-tools/RX";
import { CopyView } from "./components/CopyView";

/**
 * @param {baseVmess} info
 * @returns
 */
function getVNext(info) {
    // http协议配置
    let streamSettings = {
        network: info.net,
        security: "none",
        tcpSettings: {
            header: {
                type: "none",
            },
        },
    };

    // https协议配置
    if (info.tls) {
        streamSettings = {
            network: info.net,
            security: info.tls || "none",
            httpSettings: {
                header: {
                    path: info.path,
                    host: [info.host].filter((i) => i),
                },
            },
            tlsSettings: {
                allowInsecure: true,
                fingerprint: info.fp || "chrome",
                serverName: info.sni,
            },
        };
    }

    return {
        protocol: "vmess",
        settings: {
            vnext: [
                {
                    users: [
                        {
                            security: "auto",
                            level: 0,
                            id: info.id,
                            alterId: 0,
                        },
                    ],
                    address: info.add,
                    port: Number(info.port),
                },
            ],
        },
        streamSettings,
    };
}

export function createNewConfig(serverConfig) {
    if (!serverConfig) {
        Modal.fail("serverConfig is empty");
        return;
    }
    const appState = getAppState();
    const basecConfig = safeParse(appState.config) || {};
    const config = clone(basecConfig);
    Object.assign(config, {
        log: {
            access: `${appState.AppDir}/v2ray-core.log`,
            error: `${appState.AppDir}/v2ray-core.log`,
            loglevel: "debug",
        },
        inbounds: [
            {
                port: appState.socksPort,
                settings: {
                    udp: false,
                    auth: "noauth",
                },
                listen: appState.v2rayIP,
                protocol: "socks",
            },
            {
                listen: appState.v2rayIP,
                protocol: "http",
                port: appState.httpPort,
                settings: {
                    timeout: 360,
                },
            },
        ],
        outbounds: [
            {
                mux: {
                    concurrency: 8,
                    enabled: false,
                },
                tag: "proxy",
                protocol: serverConfig.protocol,
                settings: serverConfig.settings,
                streamSettings: serverConfig.streamSettings,
            },
            {
                settings: {
                    domainStrategy: "UseIP",
                    userLevel: 0,
                },
                protocol: "freedom",
                tag: "direct",
            },
            {
                tag: "block",
                settings: {
                    response: {
                        type: "none",
                    },
                },
                protocol: "blackhole",
            },
        ],
        dns: {},
        routing: {
            balancers: [],
            domainStrategy: "AsIs",
            rules: [
                // {
                //     "type": "field",
                //     "outboundTag": "proxy",
                //     "domain": [
                //         "domain:test.com",
                //     ]
                // },
                // {
                //     "domain": [
                //         "domain:okjike.com",
                //     ],
                //     "type": "field",
                //     "outboundTag": "direct"
                // }
            ],
        },
    });
    return config;
}

export function selectNode(lemon2id) {
    const serv = getSelectNodeConfig(lemon2id);
    const config = createNewConfig(getVNext(serv.setting));
    setAppState({
        tag: lemon2id,
        config: JSON.stringify(config, null, 2),
    });
    callGo("set-config", JSON.stringify(config, null, 2)).then(restartServer);
}

export function getSelectNodeConfig(lemon2id) {
    const appState = getAppState();
    let config = appState.manualConfig.find((i) => i.lemon2id == lemon2id);
    if (!config) {
        for (const sub of appState.subscribes) {
            for (const item of sub.servers) {
                if (item.lemon2id == lemon2id) {
                    config = item;
                    break;
                }
            }
        }
    }
    return config;
}

export function clearLog() {
    callGo("clear-v2ray-log");
    Modal.success("Clear Success");
}

export function getAllVmess() {
    const appState = getAppState();
    const list = [];
    appState.subscribes.map((i) => {
        list.push(...i.servers);
    });
    list.push(...appState.manualConfig);
    return list;
}

export function convertConfig2vmess(v2rayConfig, ps) {
    const isV2rayConfig = v2rayConfig.inbounds && v2rayConfig.outbounds;
    // 如果不是v2ray配置，就默认用户输入的是vmess缩写配置
    if (!isV2rayConfig) {
        return v2rayConfig;
    }
    // 查找 VMess 的 outbound 配置
    const vmessOutbound = v2rayConfig.outbounds.find(
        (out) => out.protocol === "vmess",
    );
    if (!vmessOutbound) {
        throw new Error("未找到 VMess outbound 配置");
    }

    // 提取关键字段
    const vnext = vmessOutbound.settings.vnext[0];
    const user = vnext.users[0];
    const streamSettings = vmessOutbound.streamSettings;
    const httpSettings = streamSettings.httpSettings || {};

    return createVmess({
        v: "2", // 协议版本
        ps,
        add: vnext.address, // 服务器地址
        id: user.id, // 用户 UUID
        port: vnext.port.toString(), // 端口（转换为字符串以匹配格式）
        aid: user.alterId.toString(), // AlterID（转换为字符串）
        net: streamSettings.network || "tcp", // 传输协议
        type: "none", // TCP 头部伪装类型（未明确指定，默认为 none）
        host: httpSettings?.host?.[0] || "", // Host 头
        path: httpSettings.path || "", // HTTP/2 或 WebSocket 路径
        tls: streamSettings.security || "", // TLS 设置
        sni: streamSettings.tlsSettings?.serverName || "", // SNI

        security: user.security || "auto", // 加密方式
        scy: user.security || "auto", // 重复字段，保持一致
        fp: streamSettings.tlsSettings?.fingerprint || "", // TLS 指纹
        alpn: httpSettings?.alpn?.join(",") || "", // ALPN（未明确指定，留空）
    });
}

export const refreshServers = (url = "", callback) => {
    if (/^https?:\/\//.test(url)) {
        getServers(url, (servers) => {
            setAppState({}, (state) => {
                state.subscribes.forEach((item) => {
                    if (item.url == url) {
                        item.servers = servers;
                    }
                });
            });
            callback && callback(servers);
        });
    }
};

export const createQRCode = (qr = "") => {
    // 获取当前配置，并生成一个二维码
    if (!qr) {
        const { config, tag } = getAppState();
        qr = JSON.stringify(
            convertConfig2vmess(safeParse(config), encodeURIComponent(tag)),
        );
    }
    const res = "vmess://" + btoa(qr);
    const qrView = <Qrcode url={res} width={300} />;
    Modal.open(
        <div className="pp20 br10" style={{ background: "#fff" }}>
            {qrView}
            <div
                className="w300 tc mt10 fs10 c666"
                style={{ wordBreak: "break-word" }}
            >
                <CopyView text={res} />
            </div>
        </div>,
        {
            position: "center",
            animationType: "ss",
            escClose: true,
        },
    );
};

export function showSelectedSever() {
    const id = getAppState().tag;
    if (!id) return;
    const dom = Array.from(document.querySelectorAll(`*`)).find((i) => {
        return i.getAttribute("data-id") == id;
    });
    if (!dom) return;
    dom.scrollIntoView({
        block: "center",
        behavior: "smooth",
    });
}

export function updateGFW(url) {
    if (!url) {
        // 如果url为空，就清空规则
        emitGoEvent({
            name: "handle-gfw",
            data: "",
            callback: restartServer,
        });
        return;
    }

    url = addQuery(url, { __time__: Date.now() });
    fetch(url)
        .then((res) => res.text())
        .then((text) => {
            emitGoEvent({
                name: "handle-gfw",
                data: atob(text),
                callback: restartServer,
            });
        });
}

export const restartServer = RX.frequency(() => {
    const { pacMode } = getAppState();
    if (pacMode) {
        callGo("pac-mode-change", pacMode);
    }
}, 1000);


export class AppRoute {
    constructor() {
        this.state = [
            // { app: "", process: "", updateTime: "", createTime: "", status: 0 }, // 0 使用代理 1 禁止请求 2 使用默认网络
        ]
        this.callbacks = []
        this.getState()
    }
    getState() {
        callGo('get-app-info').then(res => {
            this.state = safeParse(res) || []
            this.trigger()
        })
    }
    trigger(filterApp) {
        this.callbacks.filter(i => {
            if (!filterApp) {
                return true
            }
            return filterApp === i.app
        }).forEach(i => {
            const item = this.state.find(e => e.app == i.app)
            if (item) {
                i.callback(item, this.state)
            }
        })
    }
    set(app, status) {
        const item = this.state.find(i => i.app == app)
        if (item) {
            item.status = status
        } else {
            this.state.push({ app, status })
        }
        // this.state = this.state.filter(i => i.status == 0)
        this.save()
        this.trigger()
    }
    save() {
        callGo('set-app-info', JSON.stringify(this.state, null, 2))
    }
    add(app) {
        const item = this.state.find(i => i.app == app)
        if (!item) {
            this.state.push({ app, status: 0 })
            this.save()
        }
    }
    get(app, callback) {
        this.callbacks.push({ app, callback })
        this.trigger(app)
        return () => {
            this.callbacks = this.callbacks.filter(i => i.callback !== callback)
        }
    }
}
