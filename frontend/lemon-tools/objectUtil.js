/**
 * 删除指定的key，返回一个新对象
 * @param {Object} obj
 * @param {Array<string>} keys
 * @returns
 */
export function removeKeys(obj, keys = []) {
    const newObj = {}
    Object.keys(obj).forEach(k => {
        if (!keys.includes(k)) {
            newObj[k] = obj[k]
        }
    })
    return newObj;
}

/**
 * 直接操作原始对象
 * @param {Object} obj
 * @param {Array<string>} keys
 * @returns
 */
export function deleteKeys(obj, keys = []) {
    keys.forEach((k) => {
        delete obj[k];
    });
    return obj;
}

/**
 * 从对象中挑选指定的key，返回一个新对象
 * @param {Object} obj
 * @param {Array<string>} keys
 * @returns
 */
export function pickKeys(obj, keys = []) {
    const newObj = {}
    Object.keys(obj).forEach(k => {
        if (keys.includes(k)) {
            newObj[k] = obj[k]
        }
    })
    return newObj;
}

export function pickOthers(any = {}, ignoreKeys = []) {
    const newObj = {};
    Object.keys(any).forEach((k) => {
        if (!ignoreKeys.includes(k)) {
            newObj[k] = any[k];
        }
    });
    return newObj;
}
