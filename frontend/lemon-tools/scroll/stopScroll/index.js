import './index.css';

const PHONE = window.navigator.userAgent.match(/iphone|android|ipad|ios/i);
const $html = document.documentElement;

const pcStopScrollClass = 'body-stop-scroll-status';

export class StopTouchScroll {
    startY = 0;
    /**
     *
     * @param {HTMLElement} dom
     * @param {boolean} justStop 直接阻止touchmove事件
     */
    constructor(dom, justStop = false) {
        this.dom = dom;
        this.justStop = justStop;
        this.addEvents();
    }

    addEvents() {
        this.dom.addEventListener('touchstart', this.touchstart);
        this.dom.addEventListener('touchmove', this.touchmove);
    }

    removeEvents = () => {
        this.dom.removeEventListener('touchstart', this.touchstart);
        this.dom.removeEventListener('touchmove', this.touchmove);
    };

    touchstart = (event) => {
        this.startY = event.touches[0].clientY;
        this.moveStatus = undefined;
    };

    touchmove = (event) => {
        if (this.justStop) {
            event.preventDefault();
            return;
        }

        // 毕竟校验是否可以滚动是有一定性能消耗的
        // 因此这里做一个缓存，在一次move事件内，只真正校验一次即可
        if (this.moveStatus !== undefined) {
            if (this.moveStatus) {
                event.preventDefault();
            }
            return;
        }

        const ele = event.currentTarget;
        const nowY = event.touches[0].clientY;

        let $target = event.target;

        // 校验手势滚动方向，和元素在此方向是否可以继续滚动，
        // 来判断是否阻止系统的默认滚动事件
        const check = (d) => {
            // 遇到过向上滑动到底部，但是scrollTop存在小数
            // 导致其值小于d.scrollHeight - d.clientHeight的问题
            // 因此这里使用math.ceil兼容一下
            return (
                (nowY > this.startY && d.scrollTop == 0) || // 向下滑动
                (nowY < this.startY && Math.ceil(d.scrollTop) >= d.scrollHeight - d.clientHeight) // 向上滑动
            );
        };
        let isPrevent = true;
        while ($target !== ele) {
            isPrevent = check($target);
            if (!isPrevent) {
                break;
            }
            $target = $target.parentElement;
        }

        if (isPrevent) {
            event.preventDefault();
        }
        this.moveStatus = isPrevent;
    };
}

function openPcScroll() {
    if ($html.$$__prevent__num) {
        $html.$$__prevent__num = $html.$$__prevent__num - 1;
    }
    if (!$html.$$__prevent__num) {
        $html.classList.remove(pcStopScrollClass);
    }
}

export function stopPcScroll() {
    $html.$$__prevent__num = ($html.$$__prevent__num || 0) + 1;
    $html.classList.add(pcStopScrollClass);
    return openPcScroll;
}

export class StopScroll {
    isStoped = false;

    /**
     *Creates an instance of StopScroll.
     * @param {[]HTMLElement} $targets
     * @param {boolean} justStop
     * @memberof StopScroll
     */
    constructor($targets = [], justStop = false) {
        this.$targets = $targets;
        this.justStop = justStop;
    }

    // 开启阻止页面滚动
    on = () => {
        if (this.isStoped) {
            return this;
        }
        this.isStoped = true;
        if (PHONE) {
            this.stopTouchScrolls = this.$targets
                .filter((i) => i instanceof HTMLElement)
                .map((i) => new StopTouchScroll(i, this.justStop));
        } else {
            stopPcScroll();
        }
        return this;
    };

    // 关闭阻止页面滚动
    off = () => {
        if (!this.isStoped) {
            return this;
        }
        if (PHONE) {
            this.stopTouchScrolls.forEach((i) => i.removeEvents());
        } else {
            openPcScroll();
        }
        this.isStoped = false;
        return this;
    };
}
