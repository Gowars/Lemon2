/**
 * 事件广播、派发
 * @export
 * @class PubSub
 */
export class PubSub {
    // 缓存
    __cache__ = {};

    /**
     * 关闭监听
     * @param {any} key
     * @param {any} fn
     * @returns PubSub
     * @memberof PubSub
     */
    off(key, fn) {
        const { __cache__ } = this;
        if (key === undefined) {
            this.__cache__ = {};
        } else if (!fn && __cache__[key]) {
            __cache__[key] = [];
        } else {
            __cache__[key] = (__cache__[key] || []).filter((i) => i.fn !== fn);
        }
        return this;
    }

    /**
     * 事件监听
     * @param {any} key
     * @param {any} fn
     * @param {any} [times=Infinity]
     * @returns PubSub
     * @memberof PubSub
     */
    on(key, fn, times = Infinity) {
        const { __cache__ } = this;
        __cache__[key] = __cache__[key] || [];
        __cache__[key].push({ fn, times, execTimes: 0 });
        return this;
    }

    /**
     * 监听执行一定次数
     * @param {any} key
     * @param {any} fn
     * @param {number} [time=1]
     * @returns PubSub
     * @memberof PubSub
     */
    times(key, fn, time = 1) {
        return this.on(key, fn, time);
    }

    /**
     * 只执行一次
     * @param {string} [key='']
     * @param {function} [fn=()=>{}]
     * @returns
     * @memberof PubSub
     */
    once(key = '', fn = () => {}) {
        return this.times(key, fn);
    }

    /**
     * 触发事件
     * @param {any} key
     * @param {any} data
     * @returns
     * @memberof PubSub
     */
    trigger(key, ...data) {
        const { __cache__ } = this;
        (__cache__[key] || []).forEach((i) => {
            // 执行次数自增
            i.execTimes += 1;
            i.fn(...data);
            // 执行次数达到最大值，移除事件监听
            i.execTimes === i.times && this.off(key, i.fn);
        });
        return this;
    }
}

export const globalPubsub = new PubSub();
