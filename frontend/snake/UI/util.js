import RX from '@/lemon-tools/RX';

/**
 *
 * @param {HTMLElement} dom
 * @param {(name: HTMLElement) => boolean | string} selector
 * @returns {HTMLElement | null}
 */
export function getParent(dom, selector) {
    let parent = dom;
    while (parent) {
        if (typeof selector == 'function') {
            if (parent && selector(parent)) {
                return parent;
            }
        } else if (parent.classList?.contains(selector)) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}
export const scroll = {
    get top() {
        return document.body.scrollTop || document.documentElement.scrollTop;
    },
    set top(newValue) {
        document.body.scrollTop = newValue;
        document.documentElement.scrollTop = newValue;
    },
    get height() {
        return document.body.clientHeight;
    },
    getInfo() {
        const { top, height } = scroll;
        const { innerHeight } = window;
        const bottom = height - innerHeight - top;
        return {
            top,
            height,
            screenHeight: innerHeight,
            bottom,
        };
    },
};

/**
 * 监听scroll事件
 * @param {*} callback
 * @param {*} time
 * @returns
 */
export function listenScroll(callback, time, scrollELement = window) {
    // 需要可以指定scrollElement
    const realFn = RX.frequency(callback, time);

    const fn = () => {
        realFn(scroll.getInfo());
    };
    scrollELement.addEventListener('scroll', fn);

    return () => {
        scrollELement.removeEventListener('scroll', fn);
    };
}
