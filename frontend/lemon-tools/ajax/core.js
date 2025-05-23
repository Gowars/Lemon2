// @ts-check
import { EventBus } from '../EventBus';

import { apiCache } from './apiCache';
import { commonToString } from './serialize';

const defaultCallback = () => {};

/**
 * 设计目标
 * 支持静态的setup，对所有的行为的劫持，生命周期的劫持，数据的修改
 * 完整的生命周期
 *
 */
function getKeyValue(str = '', splitChar = '') {
    const index = str.indexOf(splitChar);
    if (index < 0 || !splitChar) {
        return [str];
    }
    const key = str.slice(0, index);
    const value = str.slice(index + splitChar.length);
    return [key, value];
}

// 唯一字符串
function uuid() {
    const now = Date.now();
    return `__jsonp__${now}${Math.round(now * Math.random())}`;
}

function handleBody(body, headers) {
    const KEY = 'Content-Type';
    let CT = headers[KEY];
    // https://imququ.com/post/four-ways-to-post-data-in-http.html
    // Content-Type : application/x-www-form-urlencoded; charset=utf-8 默认值
    // Content-Type : application/json; charset=utf-8 建议值
    // Content-Type : text/xml; charset=utf-8
    // Content-Type : text/plain; charset=utf-8 字符串
    // Content-Type : multipart/form-data formdata用于文件上传

    if (CT === 'application/x-www-form-urlencoded') {
        body = commonToString(body);
    } else if (CT === 'text/plain') {
        CT = 'text/plain; charset=utf-8';
        body = String(body);
    } else if (!CT || CT.includes('/json')) {
        // 默认使用json
        CT = 'application/json';
        body = JSON.stringify(body);
    }
    return [body, Object.assign({}, headers, { [KEY]: CT })];
}

// 设置请求头，但是有些key是不能被设定的
function setHeaders(xhr, headers) {
    Object.keys(headers).map((key) => xhr.setRequestHeader(key, headers[key]));
}

// 处理response
function handleResponse(responseText, dataType) {
    if (dataType.includes('json')) {
        try {
            return JSON.parse(responseText);
        } catch (err) {
            console.error('json parse error', err);
        }
    }
    return responseText;
}

// 处理responseHeaders 浏览器出于安全考虑，是无法获取到Set-Cookie
function handleResponseHeaders(xhr) {
    const headers = xhr.getAllResponseHeaders() || '';
    const obj = {};
    headers
        .split('\n')
        .filter((i) => i.trim())
        .forEach((item) => {
            const [key, value = ''] = getKeyValue(item, ':').map((i) => i.trim());
            if (key) {
                obj[key] = value;
            }
        });

    return obj;
}

export class Ajax extends EventBus {
    constructor(option) {
        super();
        if (typeof option.beforeInit === 'function') {
            option = option.beforeInit(option);
        }
        this.option = option;
        this.privateRequest();
    }

    privateRequest() {
        let { data = {}, url = '', method = 'GET', headers = {} } = this.option;

        const {
            dataType = 'json',
            jsonp: JSONP = false,
            cache,
            timeout,
            withCredentials = false,
            async: ASYNC = true,
            auth,
            onSuccess = defaultCallback,
            onError = defaultCallback,
            onComplete = defaultCallback,
            onTimeout = defaultCallback,
            onBeforeSend = defaultCallback,
            onProgress = defaultCallback,
        } = this.option;

        method = method.toUpperCase();
        if (JSONP) {
            method = 'GET';
        }

        // 请求前修改请求数据
        if (typeof this.option.modifyData === 'function') {
            data = this.option.modifyData(data);
        }

        const requestFail = (resData) => {
            onError(resData);
            onComplete(resData);
            this.trigger('error', resData).trigger('always', resData);
        };

        // 描述一个ajax请求需要哪些 type url data 因此我们组成一个字段
        const cacheUrl = `/cache?params=${encodeURIComponent(JSON.stringify({ method, url, data }))}`;

        // 请求成功
        const requestSuccess = (resData, fromCache = false) => {
            if (cache) {
                if (fromCache && resData) {
                    resData.fromCache = true; // 是不从cache过来的数据
                } else {
                    apiCache.set(cacheUrl, resData);
                }
            }
            onSuccess(resData, fromCache);
            onComplete({ type: 'success', res: resData }, fromCache);

            this.trigger('success', resData, { fromCache, xhr: this.xhr }).trigger('always', resData, {
                fromCache,
                xhr: this.xhr,
            });
        };

        cache && apiCache.get(cacheUrl).then((res) => requestSuccess(res, true));

        if (JSONP) {
            const script = document.createElement('script');
            // 获取唯一的函数名
            const callbackName = `jsonp_${uuid()}`;

            // 注册函数，用来接收返回值
            window[callbackName] = (response) => {
                window[callbackName] = null;
                requestSuccess(response);
            };

            if (typeof data === 'object') {
                data = commonToString(data);
            } else if (typeof data === 'string') {
                encodeURIComponent(data);
            }

            script.addEventListener('load', () => {
                document.head.removeChild(script);
            });
            script.onerror = script.onabort = (msg) => {
                window[callbackName] = null;
                requestFail({ type: 'error', msg });
            };

            script.src = `${url}?${data}&callback=${callbackName}`;
            document.head.appendChild(script);
        } else {
            const xhr = new XMLHttpRequest();
            this.xhr = xhr;

            if (method === 'GET' && data) {
                const dataStr = commonToString(data);
                if (url.includes('?')) {
                    url = [url, dataStr].filter((i) => i).join('&');
                } else {
                    url = [url, dataStr].filter((i) => i).join('?');
                }
            }

            xhr.open(method, url, ASYNC);
            // 支持plugin，用于重置url method
            // 添加公共头信息，query参数
            // 解析返回结果，缓存返回结果等

            xhr.addEventListener('abort', (msg) => {
                requestFail({ type: 'error', msg });
            });

            xhr.addEventListener('error', (msg) => {
                requestFail({ type: 'error', msg });
            });

            // 监听state变化
            xhr.addEventListener('readystatechange', () => {
                if (xhr.readyState === 4) {
                    const contentType = handleResponseHeaders(xhr)['Content-Type'];
                    // 请求成功，返回请求结果
                    requestSuccess(handleResponse(xhr.responseText, dataType || contentType));
                }
            });

            // 处理超时
            if (timeout) {
                xhr.addEventListener('timeout', () => {
                    requestFail({ type: 'timeout' });
                    onTimeout();
                });
                xhr.timeout = timeout;
            }

            // 处理上传进度
            if (xhr.upload) {
                xhr.upload.addEventListener('progress', (event) => {
                    const percent = Math.round((event.loaded / event.total).toFixed(2) * 100);
                    onProgress && onProgress(percent);
                });
            }

            // 如果是formdata不设置请求头，否则会造成后端报错
            // Error: bad content-type header, no multipart boundary
            if (!(data instanceof window.FormData)) {
                // 根据header处理data
                [data, headers] = handleBody(data, headers);
            }

            // 支持auth授权
            if (auth) {
                headers.Authorization = btoa(`Basic ${auth.username}:${auth.password}`);
            }

            setHeaders(xhr, headers);
            // withCredentials跨域请求传递cookie，其默认值为false
            withCredentials && (xhr.withCredentials = true);
            onBeforeSend(xhr);
            xhr.send(data);
        }
    }

    abort() {
        this.xhr && this.xhr.abort();
    }
}

export default function ajax(options = {}) {
    return new Ajax(options);
}
