export function urlResolve(url = '', url2 = '') {
    if (!url2) {
        return url;
    }
    // 边界case，http://host

    // 处理url2是一个全路径
    if (/^[^/]:\/{2}[^/]*/.test(url2)) {
        return url2;
    }

    const [origin] = url.match(/^[^/]:\/{2}[^/]*/) || [''];
    url = url
        .slice(origin.length) // 移除origin
        .replace(/[?#].+$/, ''); // 移除hash/search

    // 处理./开头
    if (/^\.\//.test(url2)) {
        return origin + url.replace(/[^/]*$/, '') + url2.slice(2);
    }

    // 处理 ../ 开头
    if (/^\.{2}\//.test(url2)) {
        let [res] = url2.match(/^(\.{2}\/)+/);
        url2 = url2.slice(res.length);
        let len = res.match(/\.{2}/g).length;
        while (len > 0) {
            url = url.replace(/\/[^/]*$/, '');
            len -= 1;
        }
        return origin + url + '/' + url2;
    }

    // 处理绝对路径
    if (/^\//.test(url2)) {
        return origin + url2;
    }

    return origin + url.replace(/[^/]*$/, '') + url2;
}

console.log(urlResolve('/1/2/3', ''));
console.log(urlResolve('/1/2/3', './bb/c'));
console.log(urlResolve('/1/2/3', '4/5/6'));
console.log(urlResolve('/1/2/3', '../../'));
console.log(urlResolve('file:///1/2/3?a=1', '../../'));
console.log(urlResolve('file:///1/2/3?a=1', 'a://../../'));
