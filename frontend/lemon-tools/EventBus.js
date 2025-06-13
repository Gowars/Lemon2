export class EventBus {
    __eventsCache = {};

    on(key = '', fn) {
        const fns = this.__eventsCache[key] || [];
        fns.push(fn);
        this.__eventsCache[key] = fns;
        return this;
    }

    off(key = '', fn) {
        const fns = this.__eventsCache[key] || [];
        this.__eventsCache[key] = fns.filter((i) => (fn ? i !== fn : false));
        return this;
    }

    trigger(key = '', ...args) {
        const fns = this.__eventsCache[key] || [];
        fns.forEach((fn) => fn(...args));
        return this;
    }

    // 执行一次
    once(key = '', fn) {
        return this.repeat(key, fn);
    }

    /**
     * 执行指定次数
     * @param {string} [key='']
     * @param {any} fn
     * @param {number} [time=1]
     * @returns
     * @memberof Events
     */
    repeat(key = '', fn, time = 1) {
        let execTime = 0;
        const newFn = () => {
            execTime += 1;
            if (execTime >= time) {
                this.off(key, newFn);
            }
            fn && fn();
        };
        this.on(key, newFn);
        return this;
    }
}
