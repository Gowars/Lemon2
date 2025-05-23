function safeDecode(url) {
    try {
        return decodeURIComponent(url);
    } catch (_) {
        return url;
    }
}

/**
 * 分割url search key value，返回decode后的[key, value]
 * @param {string} [str='']
 * @returns {array}
 */
function splitKeyValue(str = '', splitChar = '=') {
    let index = str.indexOf(splitChar);
    if (index === -1) {
        index = str.length;
    }
    return [str.slice(0, index), str.slice(index + 1)].map((i) => safeDecode(i));
}

/**
 * 解析url，返回Location Style的对象
 * @export
 * @param {string} [url='']
 * @returns
 */
export function urlParse(url = '') {
    let remainUrl = url;
    let start = 0;
    const tokens = [];
    [
        [
            /^([A-z0-9]+:)(\d+)?/,
            (result) => ({
                // 协议
                protocol: result[1],
                port: result[2],
            }),
        ],
        [
            /^\/{2}(([^./?#&]+\.?)+)/,
            (result) => ({
                // 域名
                hostname: result[1],
            }),
        ],
        [
            /^[^?#]*/,
            (result) => ({
                // pathname
                pathname: result[0],
            }),
        ],
        [
            /^[^#]*/,
            (result) => ({
                // search
                search: result[0],
            }),
        ],
    ].forEach(([reg, fn]) => {
        const result = remainUrl.match(reg);
        if (result) {
            const token = fn(result);
            token.raw = result[0];
            token.start = start;
            token.result = result;
            tokens.push(token);
            start += token.raw.length;
            remainUrl = remainUrl.slice(token.raw.length);
        } else {
            tokens.push({});
        }
    });

    tokens.push({ hash: remainUrl });

    if (!tokens[1].hostname) {
        tokens[2].pathname += [tokens[0].raw, tokens[1].raw].join('');
    }
    const info = {
        protocol: tokens[0].protocol || '',
        port: tokens[0].port || '',
        hostname: tokens[1].hostname || '',
        pathname: tokens[2].pathname || '/',
        search: tokens[3].search || '',
        hash: tokens[4].hash || '',
        href: url,
        query: {},
        origin: '',
        pathSearchHash: '',
    };
    info.origin = [info.protocol + info.port, info.hostname].filter((i) => i).join('//');
    info.pathSearchHash = [info.pathname, info.search, info.hash].join('');

    info.search
        .slice(1)
        .split('&')
        .forEach((item) => {
            const [key, v] = splitKeyValue(item);
            if (key) {
                info.query[key] = v;
            }
        });

    return info;
}

const UA = window.navigator.userAgent.toLowerCase();
const platform = navigator.platform.toLowerCase();

// https://developer.mozilla.org/en-US/docs/Web/API/NavigatorID/platform
// 对于iphone来说为 iphone ipad为ipad
// mac为macintel
// win为Win32
// 因此可以通过platform区分是浏览器的移动模式，还是真机

const phone = !!UA.match(/phone|ios|android|ipad|ipod/i);

const os = {
    phone,
    iphone: !!UA.match(/iphone/i),
    ipad: !!UA.match(/ipad/i),
    ios: !!UA.match(/ios|iphone|ipad/i),
    safari: !!UA.match(/safari/i),
    android: !!UA.match(/android/i),
    pc: !UA.match(/phone|android|ios|ipad|ipod/i),
    wechat: !UA.match(/micromessenger/i),
    webkit: !UA.match(/webkit/i),
    isPCSimulator: phone && platform.match(/mac|win/i),
};

export { os };

const loadScriptCache = {};
export function loadScript(src) {
    return new Promise((res) => {
        if (loadScriptCache[src]) {
            res();
            return;
        }
        const sc = document.createElement('script');
        sc.addEventListener('load', () => {
            loadScriptCache[src] = true;
            res();
        });
        sc.src = src;
        document.head.appendChild(sc);
    });
}

function isObj(any) {
    return !!Object.prototype.toString.call(any).match(/ object\]/i);
}

export function merge(base, ...objs) {
    objs.forEach((obj) => {
        if (isObj(base) && isObj(obj)) {
            Object.keys(obj).forEach((key) => {
                const newValue = obj[key];
                const oldValue = base[key];
                if (isObj(oldValue) && isObj(newValue)) {
                    merge(oldValue, newValue);
                } else {
                    base[key] = newValue;
                }
            });
        }
    });
    return base;
}
