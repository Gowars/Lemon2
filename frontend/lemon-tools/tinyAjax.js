/**
 *
 * @param {{ url: string, data?: Object, success?: Function, fail?: Function, method?: string, headers?: Object }} option
 */
export function tinyAjax(option) {
    const toQuery = (v) => {
        const str = [];
        Object.keys(v).forEach((i) => {
            str.push([i, v[i]].map((e) => encodeURIComponent(e)).join('='));
        });
        return str.join('&');
    };

    const setHeaders = () => {
        const hs = option.headers || {};
        Object.keys(hs).forEach((k) => {
            xhr.setRequestHeader(k, hs[k]);
        });
    };

    const body = toQuery(option.data || {});
    const xhr = new XMLHttpRequest();
    xhr.open(option.method || 'get', option.url + '?' + body);
    setHeaders();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState == 4) {
            let res = {};
            try {
                res = JSON.parse(xhr.responseText);
            } catch (err) {
                return;
            }

            option.success && option.success(res);
        }
    });
    xhr.addEventListener('abort', () => {
        option.fail && option.fail();
    });

    xhr.addEventListener('error', () => {
        option.fail && option.fail();
    });
    xhr.send();
}
