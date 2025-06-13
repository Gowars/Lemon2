import { isObject, isArray } from '../checkType';

// key -> JSON.stringify(value)
export function paramsToString(obj) {
    return Object.keys(obj)
        .map((key) => {
            if (!key) {
                return '';
            }
            const value = obj[key];
            return [encodeURIComponent(key), encodeURIComponent(JSON.stringify(value))].filter((i) => i).join('=');
        })
        .filter((i) => i)
        .join('&');
}

// object -> string
// key=value&key[key1]=value&key[keys][]=1
export function commonToString(object, prev = '', arr = []) {
    if (isObject(object)) {
        Object.keys(object).forEach((variable) => {
            let value = object[variable];
            let key = prev ? `${prev}[${variable}]` : variable;
            if (typeof object[variable] === 'object') {
                commonToString(value, key, arr);
            } else {
                [key, value] = [key, value].map(encodeURIComponent);
                arr.push(`${key}=${value}`);
            }
        });
    } else if (isArray(object)) {
        object.forEach((item, index) => {
            // 如果是对象，需要记录位置
            index = !(typeof item === 'object') ? '' : index;
            let key = prev ? `${prev}[${index}]` : `[${index}]`;

            if (typeof item === 'object') {
                commonToString(item, key, arr);
            } else {
                [key, item] = [key, item].map(encodeURIComponent);
                arr.push(`${key}=${item}`);
            }
        });
    }

    return arr.join('&');
}

// 字符串解析成对象
export function stringToCommon(str = '') {
    const obj = {};

    function createKeys(key, value) {
        let currentObj = obj;
        key.replace(/[[\]]/g, '|')
            .split(/\|{1,2}/)
            .slice(0, -1)
            .forEach((item, index, array) => {
                // 向前看，向后看一位
                const prev = array[index - 1];
                const next = array[index + 1];

                // debugger
                if (!item || /[0-9]+/.test(item)) {
                    if (prev !== undefined) {
                        let newObj;

                        if (isArray(currentObj)) {
                            if (!item || !currentObj[+prev]) {
                                newObj = [];
                                currentObj.push(newObj);
                            } else {
                                newObj = currentObj[prev];
                            }
                        }

                        if (isObject(currentObj)) {
                            newObj = currentObj[prev] || [];
                            currentObj[prev] = newObj;
                        }

                        currentObj = newObj;
                    }
                    next === undefined && currentObj.push(value);
                } else {
                    if (prev !== undefined) {
                        let newObj;

                        if (isArray(currentObj)) {
                            if (!item || !currentObj[+prev]) {
                                newObj = {};
                                currentObj.push(newObj);
                            } else {
                                newObj = currentObj[prev];
                            }
                        }

                        if (isObject(currentObj)) {
                            newObj = currentObj[prev] || {};
                            currentObj[prev] = newObj;
                        }

                        currentObj = newObj;
                    }
                    next === undefined && (currentObj[item] = value);
                }
            });
    }

    str.split('&')
        .filter((i) => i)
        .forEach((item) => {
            const [key, value] = item
                .split('=')
                .map((i) => decodeURIComponent(i))
                .filter((i) => i.trim());
            createKeys(key, value);
        });
    return obj;
}
