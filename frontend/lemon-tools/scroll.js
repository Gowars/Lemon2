export function animationDispatch(option) {
    option = Object.assign(
        {
            getEnd: () => 0,
            // 动画时长，单位为ms
            duration: 300,
            // 获取初始值
            getStart: () => 0,
            // 监听值的变化，参数为value
            onChange: () => {},
            // 动画结束回调
            onEnd: () => null,
            animate: true,
        },
        option
    );

    let target = Number(option.getEnd()) || 0;
    const { duration = 300, onEnd, onChange, getStart } = option;

    // 不执行动画，直接结束
    if (!option.animate) {
        onChange(target);
        onEnd();
        return () => {};
    }

    // 切换
    const startValue = (getStart && getStart()) || 0;
    const animationNum = Math.floor(duration / 16);
    const PER = (target - startValue) / animationNum;

    let index = 1;
    let isStop = false;

    const next = () =>
        requestAnimationFrame(() => {
            if (isStop) return;

            if (index >= animationNum) {
                isStop = true;
                onChange(target);
                onEnd && onEnd();
                return;
            }
            onChange(startValue + PER * index);
            index += 1;
            next();
        });

    next();

    return () => {
        isStop = true;
    };
}

function throttle(fn, time) {
    let now = 0;
    let timeout;
    return () => {
        clearTimeout(timeout);
        const curTime = Date.now();
        if (curTime - now > time) {
            now = curTime;
            fn();
        } else {
            timeout = setTimeout(() => {
                fn();
            }, time);
        }
    };
}

export class Scroll {
    /**
     *Creates an instance of Scroll.
     * @param {HTMLElement} scrollDOM
     * @param {HTMLElement|window} [listenDOM=scrollDOM]
     * @memberof Scroll
     */
    constructor(scrollDOM, listenDOM = scrollDOM) {
        this.scrollDOM = scrollDOM;
        this.listenDOM = listenDOM;
        this.isBody = scrollDOM === document.body;
        this.scrollKeyId = 0;

        this.trigger = () => {
            const { cache, top, bottom, height, prevTop } = this; // eslint-disable-line
            // 方向应该是实时计算出来的，而不是每次触发后计算出来的
            const direction = top - prevTop > 0 ? 'down' : 'up';
            this.prevTop = top; // eslint-disable-line
            Object.keys(this.cache).forEach((key) => {
                const fn = cache[key];
                typeof fn === 'function' &&
                    fn({
                        bottom,
                        height,
                        direction,
                        top,
                        distance: bottom,
                    });
            });
        };
        this.tick = throttle(this.trigger, 50);
        // 监控所有的滚动事件
        listenDOM.addEventListener('scroll', this.tick, { capture: true });
    }

    lazyTrigger = () => {
        this.trigger();
        setTimeout(this.trigger, 50);
        setTimeout(this.trigger, 100);
    };

    get top() {
        const top = this.scrollDOM.scrollTop;
        if (!top && this.isBody) {
            return document.documentElement.scrollTop;
        }
        return top;
    }

    set top(top) {
        this.scrollDOM.scrollTop = top;
        if (this.isBody) {
            document.documentElement.scrollTop = top;
        }
    }

    get height() {
        const top = this.scrollDOM.scrollHeight;
        if (!top && this.isBody) {
            return document.documentElement.scrollHeight;
        }
        return top;
    }

    get bottom() {
        if (this.isBody) {
            return this.height - this.top - window.innerHeight;
        }
        return this.height - this.top - this.scrollDOM.clientHeight;
    }

    prevTop = 0;

    cache = {};

    listen(key = '', fn) {
        if (typeof key === 'function') {
            fn = key;
            this.scrollKeyId += 1;
            key = `scroll-key-id-${this.scrollKeyId}`;
        }
        this.cache[key] = fn;

        return () => {
            this.remove(key);
        };
    }

    remove(key) {
        delete this.cache[key];
    }

    removeAll() {
        this.cache = {};
    }
}

export const scroll = new Scroll(document.body, window);

/**
 * 回到页面顶部
 */
export function backTop() {
    const end = 0;
    const start = scroll.top;
    const MAGIC_NUM = 200;
    // 我们不需要严格的执行全过程动画，为了性能的考虑只执行靠近目标值的附近的动画
    // 举例子从 1000 -> 200 动画，只需要执行400 -> 200
    // 举例子从 0 -> 400 动画，只需要执行200 -> 400
    animationDispatch({
        getEnd: () => end,
        duration: 300, // 毫秒
        getStart: () => {
            return start > end ? Math.min(end + MAGIC_NUM, start) : Math.max(end - MAGIC_NUM, start);
        },
        onChange: (current) => {
            scroll.top = current;
        },
        onEnd: () => null,
    });
}
