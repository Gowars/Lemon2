/**
 * 获取请求头信息
 * @export
 * @param {string} [src='/']
 * @param {*} [callback=window.console.log]
 */
export default function getHeader(src = '/', callback = window.console.log) {
    const handleHeaders = (str) => {
        const obj = {};
        str.split(/\n+/g)
            .filter((i) => i.trim())
            .forEach((item) => {
                const index = item.indexOf(':');
                const [key, value] = [item.slice(0, index), item.slice(index + 1)].map((i) => i.trim());
                obj[key] = value;
            });
        callback(obj);
    };

    const xhr = new XMLHttpRequest();
    xhr.open('get', src);
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState > 2) {
            handleHeaders(xhr.getAllResponseHeaders());
            // 拿到请求头之后，立马终止请求，减少不必要请求
            xhr.abort();
        }
    });
    xhr.send();
}
