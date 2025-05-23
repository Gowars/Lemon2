/**
 * 监控页面地址变化
 * @export
 * @param {(from: string) => void} fn
 */
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
