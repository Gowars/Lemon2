import { EventBus } from './EventBus';

import { touchstart, touchmove, touchend } from './config';

function getTouch(event) {
    return event.touches ? event.touches[0] : event;
}

/**
 * 监听双击/点击/长按事件
 * 待支持单指，双指，多指
 */
class Tap extends EventBus {
    constructor($ele, TIME = 300, longTime = TIME) {
        super();
        this.$ele = $ele;
        this.TIME = TIME;
        this.longTime = Math.max(longTime, TIME);
        this.reset();
        this._addEvents();
    }

    reset() {
        this.state = {
            clickRecord: [],
            recording: false,
            first: false,
        };
    }

    _touchstart = (event) => {
        clearTimeout(this._timeout);
        const { state } = this;
        const touch = getTouch(event);
        state.clickRecord.push({
            start: Date.now(),
            x: touch.clientX,
            y: touch.clientY,
        });
        state.recording = true;
    };

    _touchmove = () => {
        this.state.recording = false;
    };

    _touchend = (event) => {
        const { state, TIME } = this;
        // 得到连续点击次数，判断有没有比当前连续点击次数更大的事件监听，如果有就setTimeout，没有立即执行
        // 在下次touchstart的时候，清除所有setTimeout，因为按理说你已经执行了
        if (state.recording) {
            const lastItem = state.clickRecord[state.clickRecord.length - 1];
            const endTime = Date.now();
            lastItem.end = endTime;
            // 处理长按事件
            if (lastItem.end - lastItem.start >= this.longTime) {
                this.trigger('long', event);
                this.reset();
                return;
            }

            const clickedTimes = state.clickRecord.length;

            // 判断点击位置是否稳定
            if (state.clickRecord.length > 1) {
                const isPositionStable = state.clickRecord.slice(0, -1).every((item, index) => {
                    const next = state.clickRecord[index + 1];
                    return Math.abs(item.x - next.x) < 10 && Math.abs(item.y - next.y) < 10;
                });
                if (!isPositionStable) {
                    this.reset();
                    return;
                }
            }

            // 有一个问题，如果click dbclick，那么dbclick也会触发两次click
            // 这不是我们想要的，因此我们拿到监听click事件做次数
            // 过滤long也就是非数字key
            const keys = Object.keys(this._cache)
                .filter((i) => /\d+/.test(i))
                .map((i) => +i);
            const maxListenClickNums = Math.max(...keys);

            if (clickedTimes === maxListenClickNums) {
                this.trigger(clickedTimes, event);
                this.reset();
            } else {
                this._timeout = setTimeout(() => {
                    this.trigger(clickedTimes, event);
                    this.reset();
                }, TIME);
            }
        } else {
            this.reset();
        }
    };

    _addEvents() {
        if (this.isDestroy) return;
        const { $ele } = this;
        $ele.addEventListener(touchstart, this._touchstart);
        $ele.addEventListener(touchmove, this._touchmove);
        $ele.addEventListener(touchend, this._touchend);
    }

    _removeEvents() {
        const { $ele } = this;
        $ele.removeEventListener(touchstart, this._touchstart);
        $ele.removeEventListener(touchmove, this._touchmove);
        $ele.removeEventListener(touchend, this._touchend);
    }

    enable() {
        if (this._isDisable) {
            this._isDisable = false;
            this._addEvents();
        }
    }

    disable() {
        this._isDisable = true;
        this._removeEvents();
    }

    destroy() {
        this.isDestroy = true;
        this.off();
        this._removeEvents();
    }
}

export default Tap;
