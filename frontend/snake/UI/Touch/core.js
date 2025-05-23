/* eslint-disable max-len */
/* eslint-disable no-multi-assign */
/* eslint-disable no-restricted-properties */
import { EventBus } from './EventBus';

import {
    touchstart,
    touchmove,
    touchend,
    touchleave,
    isIos,
    isPhone,
    IOS_SYSTEM_SWIPE_WIDTH,
    TOUCH_DIRECTION,
    TOUCH_ACTION,
} from './config';
import util from './util';

// touches changeTouches targetTouches 的区别
// https://stackoverflow.com/questions/7056026/variation-of-e-touches-e-targettouches-and-e-changedtouches

function distance(x, y, x1, y1) {
    return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2), 2);
}

function getFinger(e) {
    return e.touches ? e.touches.length : 1;
}

function prevent(options, event) {
    if (event.cancelable) {
        options.preventDefault && event.preventDefault();
        options.stopPropagation && event.stopPropagation();
    }
}

/*
 * touch core 提供回调
 * 生命周期
 * onNativeStart
 * onStart
 * onNativeChange
 * onBeforeChange
 * onChange
 * onNativeEnd
 * onENd
 * 可在native系列事件中自己控制event preventDefault stopPropagation
 * 添加去抖动功能，比如说单指移动多少以内不算移动
 */
export default class Touch extends EventBus {
    $dom = document.body;

    constructor($dom, /** @type {import('./touchShape').ITouchOption} */ options = {}) {
        super();
        this.$dom = $dom;
        this.$eventDom = options.$eventDom || $dom;

        /** @type {import('./touchShape').ITouchOption} */
        this.options = {
            finger: 1,
            forceResetTime: 500,
            preventDefault: true,
            stopPropagation: false,
            litenLeaveEvent: true,
            iosSystemSwipe: true,
            XYWeight: 1,
            ingoreTouchElement: 'ingoreTouchElement',
            canScrollElement: 'canScrollElement',
            listenerOptions: {},
            activeClassName: '',
            effectElements: [],
            $eventDom: null,
            ignoreMouseType: [2, 3],
            dispatchClick: false,
            ...options,
        };
        this.init();
        this.addEvents();
    }

    // 初始化
    init = () => {
        this.inited = true;
        this.state = {
            start: { x: 0, y: 0 }, // 滑动开始
            move: { x: 0, y: 0 }, // 滑动中
            moveCache: { x: 0, y: 0 }, // 位移缓存
            change: { x: 0, y: 0 }, // x,y位移变化
            end: { x: 0, y: 0 }, // 滑动结束
            V: { x: 0, y: 0 }, // 位移速度
            VCache: [],
            overAllV: { x: 0, y: 0 }, // 位移速度
            scale: 1, // 缩放比例
            scalePer: 1, // 缩放变化
            scaleV: 0, // 缩放速度
            rotate: 0, // 旋转角度
            rotatePer: 0, // 旋转变化
            rotateV: 0, // 旋转速度
            finger: 0, // 触摸指个数
            nativeFingers: 0, // 当前dom上的触摸点个数
            enable: false,
            swipeX: true,
            swipeY: true,
            freeze: false,
            direction: '', // lr, ud
            isMove: false,
            action: '', // swipe pinch
        };
    };

    /**
     * 在effectElements切换className
     * @param {boolean} [addClass=true]
     * @memberof Touch
     */
    toggleActiveClass(addClass = true) {
        const { effectElements = [], activeClassName } = this.options;
        if (activeClassName) {
            [this.$dom, ...effectElements].forEach((dom) => {
                dom instanceof window.HTMLElement && dom.classList.toggle(activeClassName, addClass);
            });
        }
    }

    enable() {
        this._isDisable = false;
    }

    /**
     * 阻止任何触摸滑动默认事件，阻止滑动冒泡事件
     * @memberof Touch
     */
    disable() {
        this._isDisable = true;
    }

    destroy = () => {
        this.isDestroy = true;
        this.removeEvents();
    };

    isAddEvent = false;

    getListenerOptions() {
        return {
            passive: false,
            ...this.options.listenerOptions,
        };
    }

    addEvents() {
        if (this.isDestroy || this.isAddEvent) return;
        this.isAddEvent = true;
        this.$eventDom.addEventListener(touchstart, this.start, this.getListenerOptions());
        this.$eventDom.addEventListener(touchmove, this.move, this.getListenerOptions());
        this.$eventDom.addEventListener(touchend, this.end, this.getListenerOptions());
        !isPhone &&
            this.options.litenLeaveEvent &&
            this.$eventDom.addEventListener(touchleave, this.end, { passive: false });
    }

    removeEvents() {
        this.$eventDom.removeEventListener(touchstart, this.start);
        this.$eventDom.removeEventListener(touchmove, this.move);
        this.$eventDom.removeEventListener(touchend, this.end);
        !isPhone && this.options.litenLeaveEvent && this.$eventDom.removeEventListener(touchleave, this.end);
        this.isAddEvent = false;
    }

    getPosition(e, index = 0) {
        let x = isPhone ? e.touches[index].clientX : e.clientX;
        let y = isPhone ? e.touches[index].clientY : e.clientY;
        // 使用相对位置
        if (this.options.useRelativePos) {
            const { left, top } = this.$dom.getBoundingClientRect();
            x -= left;
            y -= top;
        }
        return {
            [`x${index || ''}`]: x,
            [`y${index || ''}`]: y,
        };
    }

    /**
     * 因为有些元素可能是可以滚动的，所以只能在滚动到边界的时候才能触发touch事件监听
     * @param {*} currentTarget
     * @returns
     * @memberof Touch
     */
    setTouchLimit(currentTarget) {
        const { options, state } = this;
        if (options.canScrollElement) {
            const scrollElement = util.parent(currentTarget, this.$dom, (d) =>
                d.classList.contains(options.canScrollElement)
            );
            if (scrollElement) {
                const { clientHeight, scrollHeight, scrollTop } = scrollElement;

                if (scrollHeight != clientHeight) {
                    if (scrollTop == 0) {
                        // 顶部
                        state.directionLimit = {
                            direction: TOUCH_DIRECTION.topToBottom,
                            only: 1,
                            scrollElement,
                        };
                    } else if (Math.ceil(scrollTop) >= scrollHeight - clientHeight) {
                        // 底部
                        state.directionLimit = {
                            direction: TOUCH_DIRECTION.topToBottom,
                            only: -1,
                            scrollElement,
                        };
                    } else {
                        state.directionLimit = {
                            direction: TOUCH_DIRECTION.topToBottom,
                            only: 0, // 不限定滚动方向
                            scrollElement,
                        };
                    }
                }
            }
        }
    }

    /**
     * 判断当前元素是否是可以忽略滑动监听
     * @param {*} target
     * @returns
     * @memberof Touch
     */
    checkIsTouchIgnore(event) {
        const { target: currentTarget } = event;
        let { ingoreTouchElement } = this.options;
        if (!Array.isArray(ingoreTouchElement)) {
            ingoreTouchElement = [ingoreTouchElement];
        }

        const isIngnore =
            ingoreTouchElement.length &&
            util.parent(
                currentTarget,
                this.$dom,
                (d) => ingoreTouchElement.some((item) => d.classList.contains(item))
                // || getComputedStyle(d).overflowX === 'scroll'
            );

        // options.checkIsTouchIgnore 也可以校验是否可以滑动
        return isIngnore || (this.options.checkIsTouchIgnore && this.options.checkIsTouchIgnore(event));
    }

    /**
     * 判断滑动方向是否受限
     * @param {string} direction
     * @param {number} change
     * @returns
     * @memberof Touch
     */
    checkTouchLimit(direction, change) {
        const { state } = this;
        const { directionLimit } = state;

        // 判断方向滑动方向是否一致 左右 上下 是否一致
        if (directionLimit && directionLimit.direction === direction) {
            // 如果<=0 表示，滑动动向相反
            if (change * directionLimit.only <= 0) {
                return true;
            }
        }

        return this.options.checkTouchLimit && this.options.checkTouchLimit(direction, change, event);
    }

    start = (/** @type {TouchEvent & { target: HTMLElement }}*/ event) => {
        // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/which
        if (this.options.ignoreMouseType.includes(event.which)) {
            return;
        }
        const { options, state } = this;
        this.removePcEvents && this.removePcEvents();
        if (this._isDisable) return;
        if (!this.$dom.contains(event.target)) return;

        prevent(options, event);
        this.trigger('nativeStart', event, state);

        // 0到2 保持稳定
        // 2到1 被销毁
        // 2 -> 3 只有一个有用
        state.nativeFingers = getFinger(event);
        this.trigger('finger:change', state.nativeFingers, state.finger);
        if (!state.freeze && !state.isMove) {
            if (this.checkIsTouchIgnore(event)) return;
            // 某些元素在内部滚动到尽头时，可以触发滚动，并且需要锁定滚动方向

            this.setTouchLimit(event.target);

            // 处理ios系统返回
            if (
                isIos &&
                options.iosSystemSwipe &&
                options.finger === 1 &&
                (event.touches[0].clientX < IOS_SYSTEM_SWIPE_WIDTH ||
                    event.touches[0].clientX > window.innerWidth - IOS_SYSTEM_SWIPE_WIDTH)
            ) {
                return;
            }

            state.finger = getFinger(event);
            state.enable = true;
            state.start =
                state.move =
                state.moveCache =
                    {
                        ...this.getPosition(event),
                        time: Date.now(),
                    };
            this.toggleActiveClass();
            // 如果是双指，记录双指位置
            if (options.finger == 2 && getFinger(event) >= options.finger) {
                state.start =
                    state.move =
                    state.moveCache =
                        {
                            ...this.getPosition(event, 1),
                            ...state.start,
                        };
            }
            this.trigger('start', state, event);
            this.trigger('startv2', { state, event });
        }
    };

    move = (event) => {
        if (this._isDisable) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        // 如果想自己控制preventDefault 可以监听nativeChange事件，处理event
        this.trigger('nativeChange', event);

        const { state, options } = this;
        const { start, moveCache, swipeX, swipeY } = state;

        if (state.touchLimit) {
            return;
        }

        // 同时只能响应一种手势，滑动 还是 缩放
        if (state.enable && !state.freeze) {
            prevent(options, event);
            let move = {
                ...this.getPosition(event),
                time: Date.now(),
            };
            const T = (move.time - moveCache.time) * 1000;

            if (
                !state.swipeY ||
                (swipeX && Math.abs(move.x - start.x) * options.XYWeight > Math.abs(move.y - start.y))
            ) {
                // canScrollElement在可以滚动的区间，不trigger滚动事件，但在touchend后要对state做重置
                if (state.swipeY && this.checkTouchLimit(TOUCH_DIRECTION.leftToRight, move.x - start.x, event)) {
                    state.touchLimit = true;
                    return;
                }
                state.direction = TOUCH_DIRECTION.leftToRight;
                state.isMove = true;
                state.swipeY = false;
            }

            if (
                !state.swipeX ||
                (swipeY && Math.abs(move.x - start.x) * options.XYWeight < Math.abs(move.y - start.y)) // 注释<=逻辑，否则pc端点击之后，就无法左右滑动了
            ) {
                if (state.swipeX && this.checkTouchLimit(TOUCH_DIRECTION.topToBottom, move.y - start.y, event)) {
                    state.touchLimit = true;
                    return;
                }
                state.isMove = true;
                state.swipeX = false;
                state.direction = TOUCH_DIRECTION.topToBottom;
            }

            // 开始滚动前
            !state.isMove && this.trigger('beforeChange', state, event);

            if (options.finger === 2 && getFinger(event) === options.finger && state.action !== TOUCH_ACTION.swipe) {
                state.action = TOUCH_ACTION.pinch;
                move = {
                    ...this.getPosition(event, 1),
                    ...move,
                };
                state.move = move;
                state.change = {
                    x: move.x - start.x,
                    y: move.y - start.y,
                    x1: move.x1 - start.x1,
                    y1: move.y1 - start.y1,
                };
                // 缩放比例
                state.scale =
                    distance(move.x, move.y, move.x1, move.y1) / distance(start.x, start.y, start.x1, start.y1);
                state.scalePer =
                    distance(move.x, move.y, move.x1, move.y1) /
                    distance(moveCache.x, moveCache.y, moveCache.x1, moveCache.y1);
                state.scaleV = state.scalePer / T;
                // 旋转角度
                state.rotate =
                    Math.atan2(move.y - move.y1, move.x - move.x1) - Math.atan2(start.y - start.y1, start.x - start.x1);
                state.rotatePer =
                    Math.atan2(move.y - move.y1, move.x - move.x1) -
                    Math.atan2(moveCache.y - moveCache.y1, moveCache.x - moveCache.x1);
                state.rotateV = state.rotatePer / T;
                // 计算滑动速度
                state.V = {
                    x: (move.x - moveCache.x) / T,
                    y: (move.y - moveCache.y) / T,
                };
                state.VCache.push(state.V);
                if (state.VCache.length > 4) {
                    state.VCache.shift();
                }
                // state.rotate *= 180 / Math.PI
                this.trigger('change', state.change, state, event);
                this.trigger('changev2', { state, event });
                state.moveCache = { ...state.move };
            }

            if (getFinger(event) === 1) {
                state.action = TOUCH_ACTION.swipe;
                state.move = move;
                state.change = {
                    x: move.x - start.x,
                    y: move.y - start.y,
                };

                // 计算滑动速度
                state.V = {
                    x: (move.x - moveCache.x) / T,
                    y: (move.y - moveCache.y) / T,
                };
                // 保留最近4个瞬时速度，以供消费
                state.VCache.push(state.V);
                if (state.VCache.length > 4) {
                    state.VCache.shift();
                }
                // 需要提供最后一次有效滑动方向，以及滑动速度
                // todo，trigger传递的state，应该是不可变state，如果传递引用的话，会导致一些问题
                this.trigger('change', state.change, state, event);
                this.trigger('changev2', { state, event });
                state.moveCache = state.move;
            }
        }
    };

    end = (event) => {
        if (this._isDisable) return false;

        const { state, options } = this;
        if (state.isMove) {
            this.removePcEvents = this.ingorePcClick();
        } else {
            // https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/PointerEvent
            // 这也是fastclick的原理吧
            if (this.options.dispatchClick && navigator.userAgent.match(/phone|android|pad|ios/i)) {
                setTimeout(() => {
                    event.target.dispatchEvent(
                        new PointerEvent('click', {
                            bubbles: true,
                            cancelable: true,
                        })
                    );
                });
            }
        }
        // 触发
        state.nativeFingers = getFinger(event);
        this.trigger('finger:change', state.nativeFingers, state.finger);
        this.trigger('nativeEnd', event);
        // 只有当前手指个数小于预期个数才有触发touch end的必要
        // 这么做的意义在哪里？监听事件可能会被重复触发？
        if (state.nativeFingers < options.finger || !isPhone) {
            this.touchend(event);
        }
        return false;
    };

    touchend = (event) => {
        const { state } = this;
        let isDone = false;
        let timeout;
        const done = () => {
            if (!isDone) {
                clearTimeout(timeout);
                isDone = true;
                const { scale } = this.state;
                this.init();
                this.state.scale = scale;
                this.toggleActiveClass(false);
            }
        };

        // 避免安卓手机，滑动穿透到body上去
        // 根据经验主义，如果滚动穿透到body，点击元素，就会把滚动移交给当前元素
        if (state.directionLimit && state.directionLimit.scrollElement) {
            state.directionLimit.scrollElement.click();
        }
        // 如果是无效滑动依然会在一定时间后执行done，但是没有在touchstart的时候clear定时器
        // timeout = setTimeout(done, options.forceResetTime) // 可能由于种种原因导致应该执行done，但是没有执行，这里用来重置
        if (state.enable && !state.freeze) {
            state.freeze = true; // 冻结，不响应事件

            this.trigger('end', state.change, done, state, event); // 触发onEnd，等待初始化
            this.trigger('endv2', { done, state, event });
            // 如果没有移动就立即终结
            if (!state.direction || state.touchLimit) {
                done();
            }
        }
    };

    /**
     * https://stackoverflow.com/questions/8643739/cancel-click-event-in-the-mouseup-event-handler/8927598
     * 解决pc上mouseup事件结束后，click事件会触发的问题
     * 对于绝大多数元素应当使用user-select: none禁止其文本选择，否则还是会触发click事件
     * @memberof Touch
     */
    ingorePcClick() {
        if (isPhone) return;

        let remove;
        const handleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            remove();
        };

        const option = {
            capture: true,
        };

        remove = () => {
            window.removeEventListener('click', handleClick, option);
        };

        window.addEventListener('click', handleClick, option);

        return remove;
    }
}
