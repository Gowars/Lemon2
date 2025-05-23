/**
 * // 获取当前页面上所有的资源链接
 * @returns {Array<string>}
 */
export function getAllResource() {
    return performance.getEntries().map((i) => i.name);
}

export function hookXHR(fn) {
    const originOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...args) {
        const result = originOpen.call(this, ...args);
        this.addEventListener('readystatechange', () => {
            fn(this.readyState, this.responseText, this);
        });
        return result;
    };
}

export function hookFetch(fn) {
    const originFetch = window.fetch;
    window.fetch = function (...args) {
        const result = originFetch(...args);
        try {
            fn(result);
        } catch (err) {
            console.log('hook fetch func error', err);
        }
        return result;
    };
}

export function watchUrl(fn) {
    var _pushState = history.pushState;
    var _replaceState = history.replaceState;
    var handler = (from) => fn(from);

    history.pushState = function (...args) {
        _pushState.call(history, ...args);
        handler('push');
    };

    history.replaceState = function (...args) {
        _replaceState.call(history, ...args);
        handler('replace');
    };

    window.addEventListener('popstate', () => handler('pop'));

    handler('launch');
}
