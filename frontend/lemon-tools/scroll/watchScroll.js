/**
 * 按照指定频率执行fn，且最后一定会触发执行fn
 * @param {Function} fn
 * @param {number} fps
 * @returns
 */
function frequency(fn, fps = 60) {
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
 * 一般用在：
 * 监听指定选择器元素，哪一个处于可视区域
 * 以在UI层面对某些元素的class进行修改
 */
export class WatchScroll {
    /**
     * @param {{ scroller: string, callback: Function, attrKey: string }} option
     */
    constructor(option) {
        this.option = option;
        this.$root = this.option.scroller;
        this.$scroller = this.option.scroller;
        // 如果没有指定scroller，则监听window滚动事件
        if (!this.option.scroller) {
            this.$root = document.documentElement;
            this.$scroller = window;
            this.isWindowScroller = true;
        }
        // 用来选中被监听的dom元素，是否出现在视图之上
        this.selector = this.option.selector;
        this.listenScroll();
    }

    getEles() {
        return Array.from(this.$root.querySelectorAll(this.selector) || []).filter((i) => {
            if (!this.option.attrKey) return true;
            return i.getAttribute(this.option.attrKey);
        });
    }

    checkIsScrollEnd() {
        // 因为部分情况下存在小数点问题，因此此处-1，以确保兼容性
        if (this.isWindowScroller) {
            return this.$root.scrollTop + window.innerHeight >= this.$root.scrollHeight - 1;
        }
        return this.$root.scrollTop + this.$root.clientHeight >= this.$root.scrollHeight - 1;
    }

    handler = frequency(() => {
        // 如果监听到滚动事件后，和ignoreScroll对比一下，如果一致，就不执行scroll后续逻辑
        if (this.$root.scrollTop === this.ingoreScroll) return;
        // 重置数据
        this.ingoreScroll = -1;

        const eles = this.getEles();
        const isScrollEnd = this.checkIsScrollEnd();
        const baseRect = this.$root.getBoundingClientRect();
        let activeEle;

        const checkIsIn = (rect1, rect2) => {
            return (
                rect1.left <= rect2.left + rect2.width &&
                rect1.left + rect1.width >= rect2.left &&
                rect1.top <= rect2.top + rect2.height &&
                rect1.height + rect1.top >= rect2.top
            );
        };

        for (let i = 0; i < eles.length; i++) {
            const item = eles[i];
            const itemRect = item.getBoundingClientRect();
            if (itemRect.height == 0 || itemRect.width == 0) {
                continue;
            }

            if (checkIsIn(itemRect, baseRect)) {
                activeEle = item;
                // 为了保障最后一个元素能够被选中
                // 如果滚动条滚到了最底部，则不break
                if (!isScrollEnd) {
                    break;
                }
            }
        }

        this.triggerCallback(activeEle);
    }, 100);

    listenScroll() {
        this.handler();
        this.$scroller.addEventListener('scroll', this.handler);
        window.addEventListener('resize', this.handler);

        // 不再使用后，请记得卸载相关事件监听
        this.unmout = () => {
            this.$scroller.removeEventListener('scroll', this.handler);
            window.removeEventListener('resize', this.handler);
        };
    }

    triggerCallback(activeEle) {
        if (!this.option.callback) return;
        const eles = this.getEles();
        this.option.callback(
            eles.map((ele) => {
                return {
                    ele,
                    active: activeEle == ele,
                };
            })
        );
    }

    /**
     * 滚动到指定视图，并且会触发callback
     * @param {string} tabValue
     * @returns
     */
    scrollTo(tabValue, offset = 0) {
        const activeEle = this.getEles().find((i) => {
            return i.getAttribute(this.option.attrKey) == tabValue;
        });
        if (!activeEle) return;
        let itemTop = 0;
        if (this.isWindowScroller) {
            itemTop = activeEle.getBoundingClientRect().top;
        } else {
            // 指定了scoller的话，其top值需要减去父元素的top
            itemTop = activeEle.getBoundingClientRect().top - this.$root.getBoundingClientRect().top;
        }
        this.triggerCallback(activeEle);

        /**
         * 在一定时间内忽略滚动条滚动说产生的滚动事件
         * 但是如果这里想想触发一个有动画效果的滚动，那么可能需要处理一下边界case
         * 就是在用户进行操作（滚动鼠标，使用键盘，触摸屏幕）需要cancel忽略行为
         * */
        this.$root.scrollTop += itemTop - offset;
        this.ingoreScroll = this.$root.scrollTop;
    }
}

/**
 * 把target滚动到root的可见区域内
 * @param {HTMLElement} root 可以是document.documentElement或者是一个可scroll的元素
 * @param {HTMLElement} target root的一个子元素
 * @returns
 */
export function scrollIntoView(root, target) {
    if (!root || !target) {
        return;
    }
    const rootRect = root.getBoundingClientRect();
    const itemRect = target.getBoundingClientRect();
    // 为了避免target刚好在顶部/底部导致看不到紧邻元素
    // 因此需要做一个偏移
    const per = itemRect.height / 2;
    // scroll需变小
    if (itemRect.top < rootRect.top) {
        root.scrollTop -= rootRect.top - itemRect.top + per;
    } else if (itemRect.top + itemRect.height > rootRect.top + rootRect.height) {
        // scroll需变大
        const change = itemRect.top + itemRect.height - (rootRect.top + rootRect.height);
        root.scrollTop += change + per;
    }
}
