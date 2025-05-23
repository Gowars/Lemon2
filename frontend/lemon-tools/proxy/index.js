/**
 * proxy api 练习
 */

function getType(target) {
    return Object.prototype.toString.call(target).split(' ')[1].slice(0, -1).toLowerCase();
}

function isObject(target) {
    return ['object', 'array'].includes(getType(target));
}

function isValue(target) {
    return ['string', 'boolean', 'number', 'undefined'].includes(getType(target));
}

function equalArr(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((item, index) => item === arr2[index]);
}

const IS_PROXY = Symbol('proxy'); // Symbol的值是唯一的，因此外部无法进行模拟
const willBeTriggered = [];
const collectDepends = [];

let isAutoRunning = false;

function addCollect(callback) {
    const collectItem = {
        callback,
        depends: [],
        destroy() {
            const index = willBeTriggered.findIndex((i) => i === collectItem);
            if (index > -1) {
                willBeTriggered.splice(index, 1);
            }
        },
    };
    collectDepends.push(collectItem);
    return collectItem;
}

function popCollect() {
    const item = collectDepends.pop();
    willBeTriggered.push(item);
    return item;
}

function collectDepend(target, keys) {
    const collectItem = collectDepends[collectDepends.length - 1];
    if (collectItem) {
        collectItem.depends.push({
            target,
            keys,
        });
    }
}

function triggerChange(target, keys) {
    willBeTriggered.forEach((item) => {
        const isDepend = item.depends.some((depend) => depend.target === target && equalArr(depend.keys, keys));

        isDepend && item.callback();
    });
}

/**
 * watch对象变化，并触发handler。返回一个Proxy化的对象
 *
 * @export
 * @template T
 * @param {T} target 被监控对象
 * @param {Function} changeHandler
 * @param {*} [option={}] 内部使用，外部请勿调用
 * @returns {T}
 */
export function watch(target, changeHandler, option = {}) {
    if (isValue(target)) {
        target = {
            value: target,
        };
    }

    const getKeys = (name) => [...(option.keys || []), name];

    const proxyTarget = new Proxy(target, {
        get(base, name) {
            if (name === IS_PROXY) {
                return true;
            }

            // 惰性转换，只有用到的时候才会转为PROXY
            let value = base[name];
            collectDepend(base, getKeys(name));
            if (isObject(value) && !value[IS_PROXY]) {
                value = watch(value, changeHandler, {
                    keys: getKeys(name),
                });
                base[name] = value;
            }
            return value;
        },
        set(base, name, value) {
            // 派发变化
            changeHandler(getKeys(name), base[name], value);
            base[name] = value;
            triggerChange(base, getKeys(name));
        },
    });
    return proxyTarget;
}

/**
 * 如果一个函数依赖的值发生变化了，会重新执行函数
 * @export
 * @param {Function} callback
 * @returns
 */
export function autoRun(callback) {
    // 对依赖进行收集
    // 对象 keys []
    // [ {}]
    let collectItem;
    let destroyAutoRun = () => {
        collectItem.destroy();
    };
    const handler = () => {
        if (isAutoRunning) {
            throw new Error('不能在autorun执行期间更改state');
        }
        destroyAutoRun();
        destroyAutoRun = autoRun(callback);
    };
    collectItem = addCollect(handler);
    isAutoRunning = true;
    callback();
    isAutoRunning = false;
    popCollect();
    // sub change -> 自动只执行
    // 再次执行autoRun

    // 销毁
    return destroyAutoRun;
}
