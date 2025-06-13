import { GreetService } from "@/bindings/changeme";
import { urlParse } from "@/lemon-tools/url";
import { uuid32 } from "@/lemon-tools/uuid";
import { Events } from "@wailsio/runtime";
import md5 from "blueimp-md5";

export function callGo(type, data = "") {
    return GreetService.Greet(JSON.stringify({ type, data }));
}

export function emitGoEvent(option) {
    const key = `event::${uuid32()}`;
    const handler = (res) => {
        option.callback(res?.data?.[0]);
        Events.Off(key, handler);
    };
    Events.On(key, handler);
    Events.Emit({
        name: option.name,
        data: JSON.stringify({
            id: key,
            body: option.data,
        }),
    });
}

export function goFetch(option) {
    const key = `fetch-res::${uuid32()}`;
    const handler = (res) => {
        console.log("goFetch:Events", res, res.data[0]);
        option.callback(res.data[0]);
        Events.Off(key, handler);
    };
    const data = JSON.stringify({
        url: option.url,
        id: key,
    });
    console.log("goFetch", data);
    Events.On(key, handler);
    callGo("fetch", data).then((res) => {
        console.log("callGo:goFetch:fetch", res);
    });
}

export function getServers(url, callback) {
    goFetch({
        url,
        callback: (res) => {
            const isRocket = url.includes("shadowrocket");
            const servers = atob(res.body)
                .split(/\n/)
                .map((i) => {
                    if (isRocket) {
                        if (i.startsWith("vmess://")) {
                            const setting = i.slice("vmess://".length);
                            const { query, pathname } = urlParse(setting);
                            // chacha20-poly1305:9be0140a-cb81-32d4-86a8-2369c8661cb1@cctv1.sg.yuntiair365.top:29909
                            const { alterId, remarks, obfs } = query;
                            const [security, id, add, port] = atob(
                                pathname.slice(1),
                            ).split(/:|@/);

                            // 构造 VMess 配置
                            return {
                                protocal: "vmess",
                                ps: remarks,
                                lemon2id: md5(i),
                                setting: {
                                    v: "2", // 协议版本
                                    ps: remarks,
                                    add, // 服务器地址
                                    id: id, // 用户 UUID
                                    port, // 端口（转换为字符串以匹配格式）
                                    aid: alterId, // AlterID（转换为字符串）
                                    net: "tcp", // 传输协议
                                    type: "none", // TCP 头部伪装类型（未明确指定，默认为 none）
                                    host: "", // Host 头
                                    path: "", // HTTP/2 或 WebSocket 路径
                                    tls: "", // TLS 设置
                                    sni: "", // SNI

                                    security: security, // 加密方式
                                    scy: security, // 重复字段，保持一致
                                    fp: "", // TLS 指纹
                                    alpn: "", // ALPN（未明确指定，留空）
                                },
                            };
                        }
                        return;
                    }
                    if (i.startsWith("vmess://")) {
                        const setting = JSON.parse(
                            atob(i.slice("vmess://".length)),
                        );
                        try {
                            setting.ps = decodeURIComponent(escape(setting.ps));
                        } catch (err) {
                            console.error("decode ps err:", err);
                        }
                        return {
                            protocal: "vmess",
                            ps: setting.ps,
                            lemon2id: md5(i),
                            setting,
                        };
                    }

                    // if (i.startsWith('vless://')) {
                    //     // TODO: 应当被删除，当下时间内，仅支持vmess是更好的选择，网络更加稳定
                    //     const setting = i.slice('vless://'.length)
                    //     const url = urlParse(setting)
                    //     const [id, address, port] = url.pathname.slice(1).split(/@|:/)
                    //     const { encryption } = url.query
                    //     return {
                    //         protocal: 'vless',
                    //         ps: md5(i).slice(0, 10),
                    //         lemon2id: md5(i),
                    //         setting: {
                    //             "vnext": [
                    //                 {
                    //                     address,
                    //                     port,
                    //                     "users": [
                    //                         {
                    //                             id,
                    //                             encryption,
                    //                             "level": 0
                    //                         }
                    //                     ]
                    //                 }
                    //             ]
                    //         },
                    //     }
                    // }
                })
                .filter((i) => i);
            servers.length && callback(servers);
        },
    });
}

export function watchGoEvent(name, callback) {
    const core = (res) => {
        callback(res.data[0], res);
    };
    Events.On(name, core);
    return () => {
        Events.Off(name, core);
    };
}
