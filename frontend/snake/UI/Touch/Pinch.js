import TouchEvent from './core';
import { EventBus } from './EventBus';
import { TOUCH_DIRECTION, isPC } from './config';
import util from './util';
import Tap from './Tap';
import { Transform } from './BetterM';

/**
 * 获取X,Y轴上的变更，对于没有scale == 1的元素，需要对滑动变更进行锁定
 * 避免左右滑动的时候触发上下滑动
 * @param {*} change
 * @param {*} state
 * @returns
 */
function getChangeXY(change, state) {
    if (state.scale == 1) {
        if (state.direction === TOUCH_DIRECTION.leftToRight) {
            return [change.x, 0];
        }
        if (state.direction === TOUCH_DIRECTION.topToBottom) {
            return [0, change.y];
        }
    }
    return [change.x, change.y];
}

export default class Pinch extends EventBus {
    // 被缩放对象是否需要加载
    isLoad = false; // 是否可以立即开启

    constructor(
        $eventDom, // 事件监听元素
        $transformDom = $eventDom, // 被缩放元素
        /** @type {{maxScale: number, minScale: number, canPinch: boolean, toggleScale: number, $borderCheckDom: HTMLElement, disableBorderCheck: boolean }} */
        option = {}
    ) {
        super();
        const {
            $borderCheckDom = $eventDom, // 边界校验元素
            canPinch = true, // 是否可缩放
            maxScale = 1,
            minScale = 1,
        } = option;
        this.option = option;
        this.canPinch = canPinch;
        this.maxScale = maxScale;
        this.minScale = minScale;
        $transformDom.style.cssText += ';transform-origin: left top; will-change: transform;';

        this.$eventDom = $eventDom;
        this.$transformDom = $transformDom;
        this.$borderCheckDom = $borderCheckDom;

        // 需要处理是否是图片，是否需要加载的问题
        if ($transformDom.tagName.toLowerCase() === 'img') {
            this.updateInfo($transformDom);
            $transformDom.$$pinch = this;
        } else {
            this.isLoad = true;
        }
        this.origin = util.getOrigin(this.$transformDom);
        // 未加载，允许左右移动，不允许缩放图片
        this.baseOrigin = util.getOrigin(this.$borderCheckDom);
        this.addEvents();

        // 矩阵变换逻辑在此
        this.trans = new Transform();

        // 页面resize时，重置baseinfo
        if (isPC) {
            window.addEventListener('resize', this.setBaseInfo);
            this.removeResize = window.removeEventListener('resize', this.setBaseInfo);
        }
    }

    setBaseInfo = ($img = this.$transformDom) => {
        this.origin = util.getOrigin(this.$transformDom);
        this.baseOrigin = util.getOrigin(this.$borderCheckDom);
        this.naturalWidth = $img.naturalWidth;
        this.maxScale = Math.max(this.naturalWidth / this.origin.width, this.maxScale);
    };

    // 获取图片信息
    updateInfo = ($img = this.$transformDom) => {
        const load = () => {
            $img.removeEventListener('load', load);
            if (this.isDestroy) return;
            // 图片加载成功，不代表一定可以获取到图片的rect信息，
            // 因此这里做个延迟判断，足以覆盖大多数情况，从严谨的角度来讲，可以直接根据img.naturalWidth/Height算出来
            this.timeout = setTimeout(() => {
                this.setBaseInfo();
                this.isLoad = true;
            }, 100);
        };
        $img.addEventListener('load', load);
        $img.src = $img.src || $img.originSrc;
        if ($img.complete || $img.width || $img.height) {
            load();
        }
    };

    addEvents() {
        let baseM = [];
        this.touch = new TouchEvent(this.$eventDom, {
            finger: 2,
            preventDefault: true,
            XYWeight: 2, // x 相对于 y 的权重比例
        })
            // onStart之前执行
            .on('nativeStart', () => {
                this.trigger('nativeStart');
                // 立即终结动画
                this.animationEnd && this.animationEnd();
            })
            .on('startv2', () => {
                this.trigger('start');
                baseM = this.trans.snap();
            })
            .on('changev2', ({ state }) => {
                const { change } = state;
                if (state.finger >= 2) {
                    if (this.isLoad && this.canPinch) {
                        this.trans.scale(state.scale, state.move, this.origin, baseM);
                    }
                } else {
                    const [changeX, changeY] = getChangeXY(change, state);
                    // 单指拖拽
                    this.trans.translate(changeX, changeY, baseM);
                    const result = this.borderCheck(this.origin, this.baseOrigin);
                    // if (state.finger == 1 && result.isOver) {
                    //     baseM = this.trans.snap()
                    //     //  = result.m;
                    // }

                    // // 如果元素可以内部滚动，那么不应当可以随意触发change事件
                    // // 应当在用户有意识的触发change事件时，才触发。避免弹窗关闭的过于敏感
                    // // 目前的应用场景主要在图片预览组件
                    if (state.finger == 1 && result.isBigger && !result.isOver) {
                        state.dontTriggerChange = true;
                    }

                    if (result.isOver && !state.dontTriggerChange) {
                        this.trigger('change', result, state); // 触发变化
                    }
                }
                util.RAF(() => {
                    // 触摸点大于2
                    this.$transformDom.style.cssText += this.trans.toCss();
                });
            })
            .on('endv2', ({ done, state }) => {
                const { change } = state;
                util.RAF(() => {
                    done();
                    if (!state.isMove) return;
                    if (state.finger >= 2) {
                        if (this.isLoad && this.canPinch && state.isMove) {
                            // 最大缩放比例校验
                            if (this.trans.getScale() > this.maxScale) {
                                const PER = this.maxScale / this.trans.getScale();
                                this.trans.scale(PER, state.move, this.origin);
                            }
                        } else {
                            return;
                        }
                    } else {
                        const K = 20000; // 滑动系数
                        const speed = state.VCache.reduce(
                            (prev, current) => {
                                prev.x += current.x;
                                prev.y += current.y;
                                return prev;
                            },
                            { x: 0, y: 0 }
                        );
                        let [finalVX, finalVY] = state.VCache.length
                            ? [(speed.x * K) / state.VCache.length, (speed.y * K) / state.VCache.length]
                            : [0, 0];

                        // 避免抖动
                        if (Math.abs(finalVX) < 20 && Math.abs(finalVY) < 20) {
                            finalVX = 0;
                            finalVY = 0;
                        }
                        const [changeX, changeY] = getChangeXY(
                            {
                                x: change.x + finalVX,
                                y: change.y + finalVY,
                            },
                            state
                        );
                        // 单指拖拽
                        this.trans.translate(changeX, changeY, baseM);
                    }

                    // 边界校验
                    const result = this.borderCheck(this.origin, this.baseOrigin, { minScale: this.minScale });
                    const ANIMATION_TIME = state.nativeFingers >= state.finger ? 0 : 0.4;
                    // 只有移动才有触发动画的必要【溢出，或者缩小了】
                    this.animation(ANIMATION_TIME);

                    // 单指触发才有回调的意义
                    if (state.finger == 1 && result.isOver && !state.dontTriggerChange) {
                        this.trigger('end', result, state, this);
                    }
                });
            });
        this.canPinch && this.enablePinch();
    }

    /**
     * 边界校验
     * @param {4x4矩阵} [m=[]]
     * @param {原始数据} [o={}]
     * @param {边界数据} [b={}]
     * @param {最大最小缩放倍数} [{ minScale = 1, maxScale = Infinity }={}]
     * @returns
     */
    borderCheck(o = {}, b = {}, { minScale = 1, maxScale = Infinity } = {}) {
        if (this.option.disableBorderCheck) {
            return {
                x: 0, // X轴溢出距离
                y: 0, // Y轴溢出距离
                isOver: false, // 是否溢出
                isBigger: false, // 被缩放对象是否大于边界尺寸
            };
        }

        let S = this.trans.getScale();
        // 处理旋转带来的宽高交换
        // let rotate = this.trans.state.rotate
        // if (Math.floor(Math.PI / rotate + 1) % 2 == 0) {

        // }

        // 如果缩放倍数小于1，还原到1
        const defaultCenter = {
            x: o.width / 2,
            x1: o.width / 2,
            y: o.height / 2,
            y1: o.height / 2,
        };
        if (S < minScale) {
            this.trans.scale(minScale / S, defaultCenter, o);
        } else if (S > maxScale) {
            this.trans.scale(maxScale / S, defaultCenter, o);
        }

        S = this.trans.getScale();

        let maxTLR = 0;
        let minTLR = 0;
        let maxTUD = 0;
        let minTUD = 0;

        // 缩放后大于基础校验宽度
        if (o.width * S > b.width) {
            maxTLR = b.left - o.left; // 因为transform-origin为left
            minTLR = maxTLR - (o.width * S - b.width); // 宽度差
        } else {
            maxTLR = minTLR = ((1 - S) * o.width) / 2; // 反则就以缩放元素的中心缩放
        }

        if (o.height * S > b.height) {
            maxTUD = b.top - o.top;
            minTUD = maxTUD - (o.height * S - b.height);
        } else {
            maxTUD = minTUD = ((1 - S) * o.height) / 2; // 反则就以缩放元素的中心缩放
        }

        // 获取最大，最小位移
        const [x, y] = this.trans.getTranslate();
        const newX = Math.max(minTLR, Math.min(maxTLR, x));
        const newY = Math.max(minTUD, Math.min(maxTUD, y));

        // newM为校正后的矩阵，
        const X = newX - x;
        const Y = newY - y;

        this.trans.translate(X, Y);
        return {
            x: -X, // X轴溢出距离
            y: -Y, // Y轴溢出距离
            isOver: X !== 0 || Y !== 0, // 是否溢出
            isBigger: o.width * S > b.width || o.height * S > b.height, // 被缩放对象是否大于边界尺寸
        };
    }

    disablePinch() {
        this.canPinch = false;
        this.tap && this.tap.destroy();
    }

    enablePinch() {
        this.canPinch = true;
        this.tap && this.tap.destroy();
        // 双击放大
        this.tap = new Tap(this.$eventDom, 600)
            .on(2, (event) => {
                const t = event.changedTouches ? event.changedTouches[0] : event;
                const center = {
                    x: t.clientX,
                    y: t.clientY,
                    x1: t.clientX,
                    y1: t.clientY,
                };
                this.toggle(center);
            })
            .on(1, () => {
                this.trans.getScale() == 1 && this.trigger('close');
            });
    }

    timeout = null;

    // 执行动画
    animation = (time = 0.4, fn = () => {}) => {
        this.touch.state.scale = this.trans.getScale();
        const { $transformDom, $eventDom } = this;
        // 也可以使用js动画来控制
        util.transition([$transformDom], time);
        $transformDom.clientHeight;
        $transformDom.style.cssText += this.trans.toCss();
        clearTimeout(this.timeout);
        const animationEnd = () => {
            clearTimeout(this.timeout);
            util.transition([$transformDom, $eventDom]);
            fn && fn();
        };
        this.animationEnd = animationEnd;
        this.timeout = setTimeout(animationEnd, time * 1000);
        return this;
    };

    rotate(R) {
        this.trans.rotate(R, this.origin);
        this.animation();
    }

    /**
     * 放大缩小切换
     * @param {any} center 缩放中心
     * @returns
     */
    toggle = (center) => {
        if (!this.isLoad) {
            return;
        }
        const { minScale, origin } = this;
        const initS = this.trans.getScale();
        if (initS > minScale) {
            // 此处可选择恢复初始状态或者缩放回原始比例
            // this.trans.scale(minScale / initS, center, origin)
            this.trans.reset();
        } else {
            const { maxScale } = this;
            const { toggleScale = 1.5 } = this.option; // 双击默认比例
            const dbClickScale = Math.min(maxScale, toggleScale);
            this.trans.scale(dbClickScale / initS, center, origin);
        }
        this.borderCheck(this.origin, this.baseOrigin);
        this.animation();
    };

    // 销毁
    destroy() {
        [this.tap, this.touch].filter((i) => i).forEach((i) => i.destroy());
        this.isDestroy = true;
        if (this.$transformDom) {
            this.$transformDom.style.cssText += ';transform: none;';
        }

        if (this.removeResize) {
            this.removeResize();
        }

        return this;
    }

    // 开启
    enable() {
        [this.tap, this.touch].filter((i) => i).forEach((i) => i.enable());
        return this;
    }

    disable() {
        [this.tap, this.touch].filter((i) => i).forEach((i) => i.disable());
        return this;
    }
}
