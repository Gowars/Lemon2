export function safeParse(v) {
    if (typeof v === "string") {
        try {
            return JSON.parse(v);
        } catch (err) {
            return v;
        }
    }
    return v;
}

export function interval(fn, option) {
    if (typeof option == "number") {
        option = { time: option };
    }
    const timer = setInterval(fn, option.time);
    if (option.imme) {
        fn();
    }
    return () => {
        clearInterval(timer);
    };
}

export function sleep(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

export const baseVmess = {
    /** 协议版本 */
    v: "",
    ps: "",
    /** 服务器地址 */
    add: "",
    /** 用户 UUID */
    id: "",
    /** 端口（转换为字符串以匹配格式） */
    port: "",
    /** AlterID（转换为字符串） */
    aid: "",
    /** 传输协议 */
    net: "",
    /** TCP 头部伪装类型（未明确指定，默认为 none） */
    type: "",
    /** Host 头 */
    host: "",
    /** HTTP/2 或 WebSocket 路径 */
    path: "",
    /** TLS 设置 */
    tls: "",
    /** SNI */
    sni: "",

    /** 加密方式 */
    security: "",
    /** 重复字段，保持一致 */
    scy: "",
    /** TLS 指纹 */
    fp: "",
    /** ALPN（未明确指定，留空） */
    alpn: "",
};

/**
 * @param {baseVmess} vmess
 * @returns {baseVmess}
 */
export function createVmess(vmess) {
    return Object.assign({}, baseVmess, vmess);
}
