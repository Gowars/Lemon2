// @ts-check
import { EventBus } from '@/lemon-tools/EventBus';

import { getOverlappingArea } from './overlapping';
import { revertStyle } from './revertStyle';
import $ from '@/lemon-tools/$';

const isPhone = window.navigator.userAgent.match(/phone|android|ios/i);
const [touchstart, touchmove, touchend, touchleave] = isPhone
    ? ['touchstart', 'touchmove', 'touchend', 'touchleave']
    : ['mousedown', 'mousemove', 'mouseup', 'mouseleave'];

/**
 * 拖拽有效时，需要阻止默认点击事件
 * @param {HTMLElement} dom
 */
function stopDefaultClick(dom) {
    const handler = (/** @type {KeyboardEvent} */ e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        dom.removeEventListener('click', handler, { capture: true });
    };
    dom.addEventListener('click', handler, { capture: true });
}

function setStyle(dom, css) {
    dom.style.cssText += css;
}

class TimeoutMannager {
    cache = [];
    add(fn, time) {
        if (time <= 0) {
            fn();
            return;
        }
        const timer = setTimeout(() => {
            fn();
            this.cache = this.cache.filter((i) => i.timer === timer);
        }, time);
        this.cache.push({
            timer,
            fn,
        });
    }
    clear() {
        this.cache.forEach((i) => clearTimeout(i.timer));
        this.cache = [];
    }
    forceExec() {
        this.cache.forEach((i) => {
            clearTimeout(i.timer);
            i.fn();
        });
        this.cache = [];
    }
}

// 每个dom上都有原始位置
export class Touch extends EventBus {
    touchActiveTime = 150; // 拖拽事件激活时间
    transitionTime = 300; // 动画时长
    timeMg = new TimeoutMannager(); // 异步任务管理
    /** @type {Touch} */
    exchangeTouch = null; // 当前元素即将前往的元素

    state = {
        // 是否要响应touchmove事件
        canMove: false,
        // 是否是有效移动
        isMove: false,
        // 是否触发touchstart事件
        isTouchStart: false,
        // 是否在运动中
        animationing: false,
        start: { x: 0, y: 0 },
        move: { x: 0, y: 0 },
        last: { x: 0, y: 0 },
        origin: { x: 0, y: 0, w: 0, h: 0 },
        // 当前元素距离向下相近元素的距离，需要实时计算
        distance: { bottomToBeforeBottom: 0, topToAfterTop: 0 },
        index: 0,
    };

    /**
     * Creates an instance of Touch.
     * @param {HTMLElement} $dom
     * @param {() => ({ data: any, index: number })} getBindData
     * @memberof Touch
     */
    constructor($dom, getBindData) {
        super();
        // 计算所有位置
        this.$dom = $dom; // 处理事件响应
        this.$eventsDom = window; // 监听事件响应
        this.getBindData = getBindData;
        this.addEvents();
        this.resetState();
        this.updateIndex();
        this.mode = 'list'; // cell
        this.eventOption = {
            capture: false,
        };
    }

    /**
     * 元素上绑定的数据
     * @returns {{ data: any, index: number }}
     * @memberof Touch
     */
    getBindData() {
        return null;
    }

    // 计算实时位置，仅当前被拖拽的元素才需要
    get realP() {
        const { origin, last, start, move } = this.state;
        const xMin = origin.x + last.x + move.x - start.x;
        const yMin = origin.y + last.y + move.y - start.y;
        return {
            xMin,
            yMin,
            xMax: xMin + origin.w,
            yMax: yMin + origin.h,
        };
    }

    // 获取元素的坐标信息，被拖拽元素的实时位置和children的元素的初始位置进行对比
    getRealP(touch) {
        const { origin } = touch;
        const xMin = origin.x;
        const yMin = origin.y;
        return {
            xMin,
            yMin,
            xMax: xMin + origin.w,
            yMax: yMin + origin.h,
        };
    }

    // 重置state
    resetState = () => {
        this.state.isMove = false; // 是否有效移动
        this.state.canMove = false; // 是否可以移动
        this.state.isTouchStart = false; // 是否触发过开始时间
        this.state.animationing = false; // 是否正在执行动画
        this.state.start = { x: 0, y: 0 };
        this.state.move = { x: 0, y: 0 };
        this.state.last = { x: 0, y: 0 };
        this.resetOrigin();
    };

    // 重新计算dom的相对位置
    resetOrigin = () => {
        this.state.origin = {
            x: $(this.$dom).position().left,
            y: $(this.$dom).position().top,
            w: this.$dom.clientWidth,
            h: this.$dom.clientHeight,
        };
    };

    // 重置所有状态
    resetAll() {
        this.getAllTouch().forEach((i) => {
            i.resetState();
            i.resetOrigin();
            i.removeCss(); // 因为transform会导致子元素的zIndex表现异常，在start的时候进行移除
            i.updateIndex(); // 重置index
        });
    }

    // 更新下标
    updateIndex() {
        this.state.index = this.getBindData().index;
    }

    /**
     * 获取所有元素
     * @returns {Array<Touch>}
     * @memberof Touch
     */
    getSiblingsTouch() {
        return Array.from(this.$dom.parentElement.children)
            .filter((i) => i.touch && i !== this.$dom)
            .map((i) => i.touch)
            .sort((a, b) => a.state.index - b.state.index);
    }

    /**
     * 获取所有元素
     * @returns {Array<Touch>}
     * @memberof Touch
     */
    getAllTouch() {
        return Array.from(this.$dom.parentElement.children)
            .filter((i) => i.touch)
            .map((i) => i.touch)
            .sort((a, b) => a.state.index - b.state.index);
    }

    // 在start的时候，计算初始信息，
    getYChange() {
        /** @type {Array<Touch>} */
        const touches = this.getAllTouch();
        const index = touches.indexOf(this);
        // 被拖拽元素相对上个元素的距离：当前元素的底部位置与上一个元素的底部
        let bottomToBeforeBottom = 0;
        let topToAfterTop = 0;
        const beforeTouch = touches[index - 1];
        if (beforeTouch) {
            bottomToBeforeBottom =
                this.state.origin.y + this.state.origin.h - (beforeTouch.state.origin.y + beforeTouch.state.origin.h);
        }

        // 相对下个元素的距离：当前元素的顶部位置与下一个元素的顶部
        const afterTouch = touches[index + 1];
        if (afterTouch) {
            topToAfterTop = this.state.origin.y - afterTouch.state.origin.y;
        }

        const result = {
            bottomToBeforeBottom,
            topToAfterTop,
        };

        // 并把所有元素的origin信息缓存起来
        // touches.forEach((i) => {
        //     result[i.state.index] = i.state.origin;
        // });

        return result;
    }

    // 获取transfrom
    getLast(target) {
        const { origin } = this.state;
        if (!target) {
            return {
                x: 0,
                y: 0,
            };
        }
        return {
            x: target.x - origin.x,
            y: target.y - origin.y,
        };
    }

    // 被拖拽元素触发的兄弟元素transform
    updateTransform(newValue) {
        if (!this.state.canMove) {
            this.state.last = this.getLast(newValue);
            this.updatePosition({ x: 0, y: 0 }, true, 'trigger');
        }
    }

    // 被拖拽元素触发的兄弟元素transform
    resetTransform() {
        this.state.last = this.getLast(this.state.origin);
        this.updatePosition({ x: 0, y: 0 }, true, 'trigger');
    }

    removeCss() {
        this.$dom.style.cssText += `
            z-index: unset;
            -webkit-transform: none;
            transform: none;
            transition: none;
        `;
    }

    // 获取触摸点位置信息
    getPosition(e, index = 0) {
        /** @type {MouseEvent} */
        const event = isPhone ? e.touches[index] : e;
        return {
            x: event.clientX,
            y: event.clientY,
        };
    }

    // 获取相对start的实时位移
    getMoveDistance() {
        const { move, start } = this.state;
        return {
            x: move.x - start.x,
            y: move.y - start.y,
        };
    }

    // 计算相交重叠
    checkOverlap = () => {
        const { origin } = this.state;
        const { realP: currentTouchPos } = this;

        const siblingsInfo = this.getAllTouch();
        siblingsInfo.some((targetTouch) => {
            const targetOrigin = { ...targetTouch.state.origin };
            // 重叠面积需要大于1/3
            if (getOverlappingArea(currentTouchPos, this.getRealP(targetTouch.state)) > (origin.w * origin.h) / 4) {
                const { index: currentIndex } = this.state;
                // 从下向上移动，目标范围内的元素都需要向下移动
                if (currentIndex > targetTouch.state.index) {
                    const needMoveTouches = siblingsInfo.slice(targetTouch.state.index, currentIndex);
                    this.needMoveTouchesSiblings = needMoveTouches;
                    siblingsInfo.forEach((touch, index, arr) => {
                        if (touch === this) return; // 忽略当前元素
                        const isNeedMove = needMoveTouches.includes(touch);
                        const currentPositon = { ...touch.state.origin };
                        if (isNeedMove) {
                            if (this.mode == 'list') {
                                if (touch.state.last.x == 0) {
                                    currentPositon.y += this.state.distance.bottomToBeforeBottom;
                                }
                            } else if (this.mode == 'cell') {
                                currentPositon.x = arr[index + 1].state.origin.x;
                                currentPositon.y = arr[index + 1].state.origin.y;
                            }
                            touch.updateTransform(currentPositon);
                        } else {
                            touch.updateTransform(currentPositon);
                        }
                    });

                    this.endOrigin = targetOrigin;
                    this.exchangeTouch = targetTouch;
                    return true;
                } else if (currentIndex < targetTouch.state.index) {
                    // 从上往下移动，目标范围内的元素都需要向上移动
                    const needMoveTouches = siblingsInfo.slice(currentIndex, targetTouch.state.index + 1);
                    this.needMoveTouchesSiblings = needMoveTouches;
                    siblingsInfo.forEach((touch, index, arr) => {
                        if (touch === this) return; // 忽略当前元素
                        const isNeedMove = needMoveTouches.includes(touch);
                        const currentPositon = { ...touch.state.origin };
                        if (isNeedMove) {
                            if (this.mode == 'list') {
                                if (touch.state.last.x == 0) {
                                    currentPositon.y += this.state.distance.topToAfterTop;
                                }
                            } else if (this.mode == 'cell') {
                                currentPositon.x = arr[index - 1].state.origin.x;
                                currentPositon.y = arr[index - 1].state.origin.y;
                            }
                            touch.updateTransform(currentPositon);
                        } else {
                            touch.updateTransform(currentPositon);
                        }
                    });

                    this.endOrigin = targetOrigin;

                    // this.endOrigin = {
                    //     y: targetOrigin.h + targetOrigin.y - origin.h,
                    //     x: origin.x,
                    // };
                    this.exchangeTouch = targetTouch;
                    return true;
                } else {
                    // 回到初始位置
                    siblingsInfo.forEach((touch) => {
                        if (touch === this) return; // 忽略当前元素
                        const currentPositon = { ...touch.state.origin };
                        touch.updateTransform(currentPositon);
                    });
                    this.endOrigin = targetOrigin;
                    this.exchangeTouch = null;
                }
            }
            return false;
        });
    };

    addEvents = () => {
        const { $eventsDom } = this;
        $eventsDom.addEventListener(touchstart, this.touchstart, this.eventOption);
        $eventsDom.addEventListener(touchmove, this.touchmove, this.eventOption);
        $eventsDom.addEventListener(touchend, this.touchend, this.eventOption);
        !isPhone && $eventsDom.addEventListener(touchleave, this.touchend, this.eventOption);
    };

    destroy = () => {
        const { $eventsDom } = this;
        $eventsDom.removeEventListener(touchstart, this.touchstart, this.eventOption);
        $eventsDom.removeEventListener(touchmove, this.touchmove, this.eventOption);
        $eventsDom.removeEventListener(touchend, this.touchend, this.eventOption);
        !isPhone && $eventsDom.removeEventListener(touchleave, this.touchend, this.eventOption);
        // this.resetState();
        this.removeCss();
    };

    toggleDomAnimation(animation = false) {
        const { $dom, transitionTime } = this;
        if (animation) {
            this.state.animationing = true;
            setStyle(
                $dom,
                `
                -webkit-transition: -webkit-transform ${transitionTime}ms, opacity ${transitionTime}ms;
                transition: transform ${transitionTime}ms, opacity ${transitionTime}ms;
            `
            );
        } else {
            setStyle($dom, `-webkit-transition: none; transition: none; `);
        }
    }

    /**
     * 更新元素位置
     * @param {{ x: number, y: number }} move 实时位移
     * @param {boolean} [animation=false] 是否执行动画
     * @param {'start'|'end'|'trigger'|'move'} [type] 类型
     * @memberof Touch
     */
    updatePosition({ x, y }, animation = false, type) {
        let last = { ...this.state.last };
        const { canMove } = this.state;
        // 目标元素
        const { $dom, transitionTime, exchangeTouch, needMoveTouchesSiblings } = this;
        const currentData = this.getBindData();
        let targetData;

        // 进行重叠判断
        if (type === 'move') {
            this.checkOverlap();
        } else if (type === 'end') {
            last = this.getLast(this.endOrigin); // 此时被拖拽元素要前端目标元素了
            this.needMoveTouchesSiblings = [];
            if (exchangeTouch) {
                targetData = this.exchangeTouch.getBindData(); // 目标元素
                this.exchangeTouch = null;
            }
        }
        let [transX, transY] = [last.x + x, last.y + y];
        // 异步渲染，其状态不能在raf内动态获取
        requestAnimationFrame(() => {
            // 计算有效重叠，A被拖拽的时候，其他元素的update事件会被触发 focus元素
            if (type === 'end') {
                const fn = () => {
                    this.toggleDomAnimation(animation);
                    const trans = `translate3d(${transX}px, ${transY}px, 0)`;
                    setStyle(
                        $dom,
                        `
                        opacity: 1;
                        z-index: unset;
                        position: unset;
                        -webkit-transform: ${trans};
                        transform: ${trans};
                    `
                    );
                    this.timeMg.clear();
                    this.timeMg.add(() => {
                        if (targetData) {
                            this.trigger('change', currentData, targetData);
                        }
                        this.resetAll();
                        this.state.animationing = false;
                        // 动画执行完毕，进入inactive模式
                        this.trigger('inactive');
                        this.state.revertStyle?.();
                    }, transitionTime + 50);
                };
                if (this.onBeforeChange && exchangeTouch) {
                    this.onBeforeChange(currentData, targetData, (isCanMove) => {
                        if (!isCanMove) {
                            needMoveTouchesSiblings.forEach((i) => i !== this && i.resetTransform());
                            targetData = null;
                            [transX, transY] = [0, 0];
                        }
                        fn();
                    });
                } else {
                    fn();
                }
            } else {
                this.toggleDomAnimation(animation);
                let extCss = ';';
                if (type === 'start' || type === 'move') {
                    extCss = 'scale3d(1.06, 1.06, 1); opacity: 0.8;';
                }
                setStyle(
                    $dom,
                    `
                    position: relative;
                    ${canMove && 'z-index: 100;'}
                    -webkit-transform: translate3d(${transX}px, ${transY}px, 0) ${extCss}
                    transform: translate3d(${transX}px, ${transY}px, 0) ${extCss}
                `
                );
            }
        });
    }

    findParent(dom, callback) {
        while (dom) {
            if (callback(dom)) {
                return dom;
            }
            dom = dom.parentElement;
        }
    }

    touchstart = (/** @type {MouseEvent & { target: HTMLElement }} */ event) => {
        if (
            [2, 3].includes(event.which) || // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/which
            !this.$dom.contains(event.target) || // 通过事件代理处理手势，因此在此处需要判断target是否在$dom内
            this.$dom.classList.contains('transition') || // 当前元素还在执行动画
            event.target.classList.contains('other-touch-action') || // 忽略拖拽手势的元素
            $(event.target).parents('.other-touch-action').length ||
            this.getSiblingsTouch().some((e) => e.state.animationing) || // 有其他元素还在执行动画中
            this.findParent(event.target, (i) => i.classList.contains('disable-sort-ceil'))
        ) {
            return;
        }

        this.timeMg.clear();
        this.resetAll();
        this.state.distance = this.getYChange();
        this.state.isTouchStart = true;
        this.state.start = this.getPosition(event);
        this.state.revertStyle = revertStyle(this.$dom, ['position', 'z-index', '-webkit-transform', 'opacity']);

        this.timeMg.add(() => {
            // 获取位置
            this.state.canMove = true;
            this.updatePosition({ x: 0, y: 0 }, true, 'start');
            this.trigger('active');
        }, this.touchActiveTime);
    };

    /**
     * @param {Event} event
     * @memberof Touch
     */
    touchmove = (/** @type {MouseEvent} */ event) => {
        if (!this.state.canMove) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.state.isMove = true;
        this.state.move = this.getPosition(event);
        this.updatePosition(this.getMoveDistance(), false, 'move');
    };

    touchend = (/** @type {MouseEvent & { target: HTMLElement }} */ event) => {
        this.timeMg.clear();
        if (
            event.target.classList.contains('other-touch-action') ||
            $(event.target).parents('.other-touch-action').length
        ) {
            return;
        }

        const { isMove, canMove } = this.state;

        if (isMove) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (canMove) {
            stopDefaultClick(this.$dom);
            this.updatePosition({ x: 0, y: 0 }, true, 'end');
        } else {
            this.state.isTouchStart && this.trigger('click', event);
        }
        this.resetState();
    };
}
