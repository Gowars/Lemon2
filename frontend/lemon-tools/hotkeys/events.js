export default class Events {
    __eventsCache = {};

    /**
     * 监听事件
     * @param {string|Array<string>} [key='']
     * @param {(e: KeyboardEvent) => void} fn
     * @returns
     * @memberof Events
     */
    on(key = '', fn) {
        if (Array.isArray(key)) {
            key.forEach((i) => this.on(i, fn));
        } else {
            const fns = this.__eventsCache[key] || [];
            fns.push(fn);
            this.__eventsCache[key] = fns;
        }
        return this;
    }

    off(key = '', fn) {
        const fns = this.__eventsCache[key] || [];
        this.__eventsCache[key] = fns.filter((i) => (fn ? i !== fn : false));
        return this;
    }

    trigger(key = '', ...args) {
        const fns = this.__eventsCache[key] || [];
        fns.some((fn) => fn(...args) === true); // 可中断
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
