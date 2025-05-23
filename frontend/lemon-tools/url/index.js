/**
 * 安全解码
 * @param {string} str
 * @returns {string}
 */
function safeDecode(str) {
    if (typeof str !== 'string') {
        return str;
    }
    try {
        return decodeURIComponent(str);
    } catch (_) {
        return str;
    }
}

/**
 * 分割url search key value，返回decode后的[key, value]
 * @param {string} [str]
 * @param {string} [splitChar]
 * @returns {Array<string>}
 */
function splitKeyValue(str, splitChar) {
    let index = str.indexOf(splitChar);
    let value;
    if (index === -1) {
        index = str.length;
    } else {
        value = str.slice(index + 1);
    }
    const key = str.slice(0, index);
    return [key, value].map((i) => safeDecode(i));
}

function queryToString(obj) {
    return Object.keys(obj)
        .map((key) => {
            const value = obj[key];
            if (value === undefined) {
                return key;
            }
            return [key, value].map((i) => encodeURIComponent(String(i))).join('=');
        })
        .join('&');
}

/**
 * 解析url，返回Location Style的对象
 * @export
 * @param {string} [url='']
 * @returns
 */
export function urlParse(url = window.location.href) {
    let remainUrl = url;
    let start = 0;
    const tokens = [];
    // 按照顺序依次解析
    [
        {
            reg: /^[A-z0-9]+:/,
            fn: (result) => ({
                protocol: result[0],
            }),
        },
        {
            reg: /^\/{2}(([^./?#&:]+\.)*([^./?#&:]+))(:\d+)?/,
            fn: (result) => ({
                hostname: result[1],
                port: result[4],
            }),
        },
        {
            reg: /^[^?#]*/,
            fn: (result) => ({
                pathname: result[0],
            }),
        },
        {
            reg: /^[^#]*/,
            fn: (result) => ({
                search: result[0],
            }),
        },
    ].forEach(({ reg, fn }) => {
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

    const addChar = (char, str) => (str ? char + str : str);
    // 自动添加/
    let path = tokens[2].pathname || '/';
    if (!/^\//.test(path)) {
        path = '/' + path;
    }

    const info = {
        protocol: tokens[0].protocol || '',
        port: (tokens[1].port || '').slice(1),
        hostname: tokens[1].hostname || '',
        pathname: path,
        search: tokens[3].search || '',
        hash: tokens[4].hash || '',
        href: url,
        query: {},
        get origin() {
            const hostnameAndPort = info.hostname + addChar(':', info.port);
            if (this.protocol) {
                return [info.protocol, hostnameAndPort].join('//');
            }
            return addChar('//', hostnameAndPort);
        },
        toString() {
            const search = queryToString(info.query);
            info.search = addChar('?', search);

            // pathname必须要以/开头
            if (!/^\//.test(info.pathname)) {
                info.pathname = '/' + info.pathname;
            }

            return info.origin + info.pathname + info.search + info.hash;
        },
    };

    const realSearch = info.search.slice(1);
    if (realSearch) {
        realSearch.split('&').forEach((item) => {
            const [key, v] = splitKeyValue(item, '=');
            info.query[key] = v;
        });
    }

    return info;
}

/**
 * 添加query
 * @param {string} [url='']
 * @param {any} args
 * @returns
 */
export function addQuery(url, ...args) {
    const info = urlParse(url);
    info.query = Object.assign(info.query, ...args);

    return info.toString();
}

export function autoCompleteUrl(url) {
    const result = urlParse(url);
    result.hostname = result.hostname || location.hostname;
    result.protocol = result.protocol || location.protocol;
    return result.toString();
}
