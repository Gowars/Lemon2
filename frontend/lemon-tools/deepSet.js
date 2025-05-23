/**
 * 为对象的链式key设置值
 * @param {*} obj
 * @param {string} keys 链式key，仅支持[.]操作符，不支持数组
 * @param {*} value
 * @returns
 */
export function deepSet(obj, keys, value) {
    let node = obj;
    const allKeys = keys.split('.');
    const last = allKeys[allKeys.length - 1];
    if (!last) return obj;

    allKeys.slice(0, -1).forEach((key) => {
        node[key] = node[key] ?? {};
        node = node[key];
    });
    node[last] = node[last] ?? value;
    return obj;
}

// console.log(
//     deepSet({}, 'a.b.c', 1)
// )
