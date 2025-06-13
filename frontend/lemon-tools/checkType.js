/**
 * 获取指定数据的类型
 * @param  {any} obj [description]
 * @return {'array'|'object'|'string'|'function'|'number'|'boolean'|'undefined'|'null'} [数据类型]
 */
export function getType(obj) {
    return Object.prototype.toString
        .call(obj)
        .toLowerCase()
        .match(/([^ ]+)\]$/)[1];
}

export function is(any, type) {
    return getType(any) === type;
}

const every = (fn) => (...args) => args.every(fn);

export const isFunc = every((i) => typeof i === 'function');

export const isBool = every((i) => typeof i === 'boolean');

export const isString = every((i) => typeof i === 'string');

export const isNumber = every((i) => getType(i) === 'number' && !Number.isNaN(i));

export const isNaN = every((i) => !Number.isNaN(i));

export const isArray = every((i) => Array.isArray(i));

export const isObject = every((i) => getType(i) === 'object');

export const isNull = every((i) => i === null);

export const isPromise = every((i) => getType(i) === 'promise');

export const isGenerator = every((i) => getType(i) === 'generatorfunction');

export const isAsync = every((i) => getType(i) === 'asyncfunction');

export const isEmpty = every((any) => {
    if (!any) {
        return true;
    }

    if (isArray(any)) {
        return any.length === 0;
    }

    if (isObject(any)) {
        return Object.keys(any).length === 0;
    }

    return false;
});
