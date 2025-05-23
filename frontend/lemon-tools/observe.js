const getType = (any) =>
    Object.prototype.toString
        .call(any)
        .match(/([^\s]+)]$/)[1]
        .toLowerCase();
const handleKey = (prev, key) => (prev ? `${prev}.${key}` : key);
const OBSERVE_KEY = '__observe__';
class Observe {}

/**
 * 返回一个可被监听的数据
 * @param {any} any
 * @param {function} [callback=()=>{}] 数据变化后回调
 * @param {boolean} [deep=false] 是否深度监听
 * @param {object} [options={}] 其他配置
 * @returns
 */
function observe(any, callback = () => {}, deep = false, options = {}) {
    // 只监听object/array
    switch (getType(any)) {
        case 'object': {
            if (checkIsObserve(any)) {
                return any;
            }
            const newObj = observeObj(any, callback, deep, options);
            Object.defineProperty(newObj, OBSERVE_KEY, {
                value: new Observe(),
                enumerable: false,
                writable: false,
            });
            return newObj;
        }
        case 'array':
            return checkIsObserve(any) || observeArr(any, callback, deep, options);
        default:
            return any;
    }
}

// 监听对象
function observeObj(obj, callback = () => {}, deep = false, options = {}) {
    const newObj = {};
    Object.keys(obj).forEach((key) => {
        let value = obj[key];
        if (deep) {
            value = observe(value, callback, deep, { ...options, prev: handleKey(options.prev, key) });
        }
        observeKey(newObj, key, value, callback, deep, options);
    });
    return newObj;
}

// 处理属性
function observeKey(obj, key, value, callback = () => {}, deep = false, options = {}) {
    return Object.defineProperty(obj, key, {
        get() {
            console.log(key, value, handleKey(options.prev, key), options.depends);
            options.depends && options.depends(handleKey(options.prev, key));
            return value;
        },
        set(newValue) {
            // 只有数据变化，才触发回调
            if (newValue !== value) {
                const oldValue = newValue;
                callback({
                    key: handleKey(options.prev, key),
                    oldValue,
                    newValue,
                });
                if (deep) {
                    newValue = observe(newValue, callback, deep);
                }
                value = newValue;
            }
        },
    });
}

// 监听数组
function observeArr(arr, callback = () => {}, deep = false, options = {}) {
    const newArr = [...arr];
    const handleDeepObserve = () => {
        if (deep) {
            newArr.forEach((any, index) => {
                const prev = `${options.prev || ''}[${index}]`;
                newArr[index] = observe(any, callback, deep, { prev });
            });
        }
    };

    ['push', 'splice', 'unshift', 'shift', 'pop'].forEach((key) => {
        Object.defineProperty(newArr, key, {
            get() {
                return (...args) => {
                    callback({
                        key: options.prev,
                        type: key,
                        change: args,
                        isArray: true,
                    });
                    const result = Array.prototype[key].call(newArr, ...args);
                    handleDeepObserve();
                    return result;
                };
            },
            enumerable: false,
        });
    });

    handleDeepObserve();
    return newArr;
}

// 解除属性监听
function unObserveKey(obj, key, value) {
    return Object.defineProperty(obj, key, {
        value,
        writable: true,
    });
}

// 添加属性监听
function add(any, key) {
    return observeKey(any, key, any[key]);
}

// 解除属性监听
function remove(any, key) {
    return unObserveKey(any, key, any[key]);
}

// 添加observe标识
function addTag(any) {
    Object.defineProperty(any, OBSERVE_KEY, {
        get() {
            return new Observe();
        },
        enumerable: false,
        writable: false,
    });
}

// 判断是否被监听
function checkIsObserve(any) {
    return any[OBSERVE_KEY] instanceof Observe ? any : null;
}

export default observe;
export { add, remove, addTag };
