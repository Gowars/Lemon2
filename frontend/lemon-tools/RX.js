// 经常面临的一个问题是，点击按钮多次触发同一个事件
// 或者像keydown/scroll等事件被连续触发
//
/**
 * 函数只执行一次
 * @param {function} fn
 * @param {function} done 执行完毕后回调
 * @returns
 */
export function once(fn, done) {
    return this.times(fn, 1, done);
}

/**
 * 函数执行几次
 * @param {function} fn
 * @param {number} [time=Infinity]
 * @param {function} [done=() => {}]
 * @returns
 */
export function times(fn, time = Infinity, done = () => {}) {
    let doneTimes = 0;
    return (...args) => {
        doneTimes += 1;
        if (doneTimes > time) {
            return;
        }
        fn(...args, doneTimes);
        if (doneTimes === time) {
            done(doneTimes);
        }
    };
}

/**
 * 如果事件失败了，会重复执行retryTime次，每次时间间隔为timeSpace毫秒
 * @param {function} fn
 * @param {number} [retryTime=0]
 * @param {number} [timeSpace=0]
 * @returns
 */
export function retry(fn, retryTime = 0, timeSpace = 0) {
    // 什么东西有有retry的方法，大概是包含了complete/fail/success方法的对象
    let execTime = 0;
    let argsCache = [];

    const fail = () => {
        if (execTime >= retryTime) {
            return;
        }
        // 延时执行
        setTimeout(() => {
            execTime += 1;
            newFn(...argsCache, fail);
        }, timeSpace);
    };

    const newFn = (...args) => {
        argsCache = args;
        fn(...argsCache, fail);
    };

    return newFn;
}

/**
 * 惰性执行，去抖动
 * @param {function} fn
 * @param {number} [fps=1000 / 60]
 * @returns
 */
export function debounce(fn, fps = 1000 / 60) {
    let ST = null;
    return (...args) => {
        if (fps > 0) {
            clearTimeout(ST);
            ST = setTimeout(() => {
                fn(...args);
            }, fps);
        } else {
            fn(...args);
        }
    };
}

/**
 * 以某个频率做某件事情，且第一次、最后一次调用必然会被触发
 * @param {function} fn
 * @param {number} [fps=60]
 * @returns
 */
export function frequency(fn, fps = 60) {
    let time = 0;
    let ST;
    return (...args) => {
        clearTimeout(ST);
        const now = Date.now();
        const distance = now - time;

        if (distance >= fps) {
            time = now;
            fn(...args);
        } else {
            ST = setTimeout(() => {
                fn(...args);
            }, fps);
        }
    };
}

/**
 * 事件被第一次触发后，立即执行，当过了fps后才能再次响应执行
 * @param {function} fn
 * @param {number} [fps=0]
 * @returns
 */
export function throttle(fn, fps = 0) {
    let disabled = false;

    return (...args) => {
        if (!disabled) {
            disabled = true;
            fn(...args);

            fps > 0 &&
                setTimeout(() => {
                    disabled = false;
                }, fps);
        }
    };
}

/**
 * 事件第一次被触发后，立即执行，后续事件是否能继续执行，需要callback来决定，callback会被注入一个done参数
 * @param {*} callback
 * @returns
 */
export function throttleByHand(callback) {
    let disabled = false;

    function enable() {
        disabled = false;
    }
    callback = callback(enable);
    return (...args) => {
        if (!disabled) {
            disabled = true;
            return callback(...args);
        }
    };
}

export default {
    once,
    times,
    retry,
    debounce,
    frequency,
    throttle,
    throttleByHand,
};
