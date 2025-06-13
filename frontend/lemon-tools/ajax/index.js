import ajax, { Ajax } from './core';
import { createX } from './stream';
import { merge } from './merge';
import { addQuery } from '../url';

export function jsonp(url, data, callback) {
    return new Ajax({
        url,
        data,
        method: 'GET',
        success: callback,
        jsonp: true,
    });
}

const middlewares = [];

/**
 * 发起网络请求
 * @param {string} url 接口请求地址
 * @param {import('.').IHttpOption} options
 * @returns
 */
export function http(url, options = {}) {
    return new Promise((resolve, reject) => {
        const x = createX(
            ({ done, error }) => {
                if (options.params) {
                    url = addQuery(url, options.params);
                }

                const ajaxOption = {
                    ...options,
                    url,
                    data: options.body || options.data,
                };

                // 支持对请求参数进行修改
                middlewares.concat(options.middlewares || []).forEach((item) => {
                    item.request && item.request(ajaxOption);
                });
                ajax(ajaxOption).on('success', done).on('error', error);
            },
            (res) => {
                // 请求成功回调，需要经过中间件的层层校验
                if (res.result) {
                    resolve(res.result);
                } else {
                    reject(res.err);
                }
            }
        )
            // check错误中间件
            .add((next) => (action) => {
                if (action.error) {
                    // 限制retry的次数
                    action.ctx.execTime < 3 && action.retry(3000);
                } else {
                    next(action);
                }
            });

        // 支持对请求结果进行修改
        middlewares.concat(options.middlewares || []).forEach((item) => {
            item.response && x.add(item.response);
        });

        x.run();
    });
}

http.hook = (item) => {
    middlewares.push(item);
};

/**
 * 创建网络请求
 * @param {import('.').CreateFetchOption} baseOption
 * @returns
 */
export function createHttp(baseOption = {}) {
    return (/** @type {string} */ url, /** @type {import('.').IHttpOption} */ options) => {
        const { baseUrl = '', baseQuery, params, ...other } = baseOption;
        let finalUrl = (baseUrl || '') + url;

        if (baseQuery || params) {
            finalUrl = addQuery(finalUrl, baseQuery() || {}, params);
        }

        return http(finalUrl, merge(options, other));
    };
}
