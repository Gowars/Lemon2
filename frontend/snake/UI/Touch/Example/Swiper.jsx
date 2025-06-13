import React, { Component } from 'react';
import TouchEvent from '../core';
import util from '../util';
import Pinch from '../Pinch';
import { getProps } from '@/lemon-tools/getProps';

/**
 * swiper的本质
 * a b c d e f g
 * [a b c]
 * 根据当前index，不停的切换 [a b c] -> [b c d]
 * 或者把所有的元素都列举出来
 * [a b c d e f g] 修改translate
 * 但在轮换播放的时候可能会有一点问题
 * 如果只有2个元素应该如何处理？
 * 可以通过动态调整silings元素的style以达到效果
 */

/*
 * 1. 如果不可loop
 *    只需要更改transform，可以指定缓存dom数量，避免无限item
 * 2. 可loop
 *    需要有dom复用，可以指定缓存dom数量
 */

/** @typedef {{ enable: boolean, distance: number }} TouchProps */

function toggleTransition(dom = document.body, add = true) {
    if (add) {
        dom.style.cssText += `
            -webkit-transition: transform .3s;
            transition: transform .3s;
        `;
        return;
    }
    dom.style.cssText += `
        -webkit-transition: none;
        transition: none;
    `;
}

const defaultProps = {
    /** 显示指定元素 */
    current: 0,
    list: [],
    /** 循环 */
    loop: true,
    /** 滚动方向 X: lr  Y: ud */
    direction: 'lr',
    /** 是否启用缩放 */
    pinch: false,
    /** 是否启用key event */
    keyEvent: false,
    style: {},
    /** 是否自动播放 */
    autoPlay: false,
    autoPlayTime: 1000,
    /** 两个元素间间隔 */
    space: '10px',
    /** 只支持3或者0，因为实际的应用场景只有3个或者不开启 */
    cacheDOMLen: 3,
    touch: {
        /** 是否阻止默认事件 */
        preventDefault: false,
        /** 是否阻止事件冒泡 */
        stopPropagation: false,
        /** 是否响应触摸事件 */
        enable: true,
        /** 触发滑动的有效距离 */
        distance: 60,
    },
    pageHideDisableAutoPlay: true,
    renderItem: () => null,
    renderChildren: () => null,
    /** 监听变化 */
    onChange: () => {},
    /** 监听移动 */
    onSwiperMoving: () => undefined,
};

/**
 * | 0 1 2 3 4 5 正常数组
 * | -2 -1 0 1 2 新增项数组
 * 为了保证current不变我们需要用偏移量去矫正current保证state中的current不变，然后我们外部获得的也的确是list中的索引
 * @extends {Component<defaultProps, {}>}
 */
export default class Swiper extends Component {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    constructor(props) {
        super(props);
        this.timeout = new util.Timeout();
        this.state = {
            current: this.mixProps.current,
        };
    }

    componentDidMount() {
        this.setDOMStyle();
        !this.mixProps.pinch && this.listenChange();
        this.mixProps.keyEvent && this.addKeyEvents();
        this.startAutoPlay();
        this.addPageListener();
    }

    componentDidUpdate(prevP) {
        if (prevP.list.length !== this.mixProps.list.length) {
            this.setDOMStyle();
        }
    }

    componentWillUnmount() {
        this.stopAutoPlay();
        this.removePageListener();
    }

    // 获取可缓存dom的长度，我们不可能添加无限长的dom，为了提升性能
    get cacheDOMLen() {
        return Math.min(this.mixProps.cacheDOMLen, this.mixProps.list.length, 3);
    }

    // 是否需要复用dom
    get useHighPerformance() {
        return this.cacheDOMLen > 0;
    }

    // current item 在 cacheDOM 数组中所处的位置
    // 优化点，0 [1, 2, 3, 4, 5] 6 7
    // 我们只有在current靠近1，5的时候，才需要更新dom
    get currentItemOffset() {
        if (this.mixProps.list.length == 1) {
            return 0;
        }
        return 1;
    }

    get $sibling() {
        return this.$current.nextElementSibling || this.$current.previousElementSibling;
    }

    get className() {
        const { S = {}, list = [], loop } = this.mixProps;
        const { current } = this.state;

        let disableClass = '';
        if (list.length > 1) {
            disableClass = [
                (current != 0 || loop) && 'prev', // 阻止向上一个滚动
                (current != list.length - 1 || loop) && 'next', // 阻止向下一个滚动
            ]
                .filter((i) => i)
                .map((i) => `swiper-disable-${this.mixProps.direction}-${i}`)
                .join(' ');
        }

        return [
            'ui-touch-swiper',
            `swiper-direction-${this.mixProps.direction}`, // 添加swiper滚动方向class
            S.wrap,
            disableClass, // 添加swiper阻止事件方向
        ]
            .filter((i) => i)
            .join(' ');
    }

    /**
     * 矫正index
     *
     * @param {number} [i=0]
     * @returns
     * @memberof Swiper
     */
    fixIndex(i = 0) {
        const { list } = this.mixProps;
        i = i < 0 ? list.length + i : i;
        i = i >= list.length ? i % list.length : i;
        return i;
    }

    resetPinch() {
        this.pinch && this.pinch.destroy();
        this.mixProps.pinch && this.setPinch();
    }

    resetMax() {
        this.max = this.$dom[this.isLR ? 'clientWidth' : 'clientHeight'];
    }

    /**
     * 矫正change
     *
     * @param {any} v
     * @returns
     * @memberof Swiper
     */
    fixChange(v) {
        if (v > 0) {
            return Math.min(v, this.max);
        }
        return Math.max(v, -this.max);
    }

    // 获取位移
    getChange(change) {
        // 对change的值进行过滤
        // 开启最大最小距离校验
        let C = this.isLR ? change.x : change.y;

        if (this.isCanMove()) {
            return Math.max(-this.max, Math.min(this.max, C));
        }

        const { current } = this.state;
        const { list } = this.mixProps;

        if (current == 0) {
            // 最大值0 最小值不限制
            C = Math.max(-this.max, Math.min(0, C));
        }

        if (current == list.length - 1) {
            // 最大值不限制 最小值为0
            C = Math.max(0, Math.min(this.max, C));
        }

        return C;
    }

    // 位移
    transform(v) {
        const translate = [this.isLR ? v : 0, !this.isLR ? v : 0, 0].join(',');
        return `;
            -webkit-transform: translate3d(${translate});
            transform: translate3d(${translate});
        `;
    }

    // 设置初始位置
    setStyle(v) {
        return `;
            ${this.isLR ? 'left' : 'top'}: ${v};
            ${this.isLR ? 'top' : 'left'}: 0;
            height: 100%;
            width: 100%;
        `;
    }

    handlePosition(origin, i) {
        let { space } = this.mixProps;

        // origin = Number(origin.replace('%', '')) * 0.8 + '%'

        if (!space || i === 0) {
            return origin;
        }

        // if (i > 0) {
        if (space) {
            const [, num, unit] = space.match(/(\d+)(.*)/);
            space = Number(num) * Math.abs(i) + unit;
        }
        // }

        if (i < 0) {
            return `calc(${origin} - ${space})`;
        }

        return `calc(${origin} + ${space})`;
    }

    handleLen2Case(C) {
        // 处理只有两个元素，需要根据活动方向动态调整位置
        if (this.mixProps.list.length == 2) {
            const PER = -C / Math.abs(C);
            this.$sibling.style.cssText += this.setStyle(this.handlePosition(`${PER * 100}%`, PER));
        }
    }

    // 是否响应滑动
    isCanMove() {
        const { list, loop } = this.mixProps;
        if (loop) {
            return true;
        }

        const { current } = this.state;

        // 不可循环轮播
        return !(current == 0 || current == list.length - 1); // 第一个元素，向右滑动
    }

    /**
     * 获取被缩放对象
     *
     * @param {any} ele
     * @returns
     * @memberof Swiper
     */
    getScaleTarget(ele) {
        return ele.querySelector('.scale-target') || ele;
    }

    // get change from own event listener
    listenChange() {
        // 不响应用户触摸行为
        const { touch = {} } = this.mixProps;
        if (!touch.enable) {
            return;
        }
        let initX = 0;
        this.touchEvent = new TouchEvent(this.$dom, {
            finger: 1,
            preventDefault: touch.preventDefault,
        })
            .on('nativeStart', () => {
                this.stopAutoPlay();
            })
            .on('startv2', () => {
                this.resetMax();
                initX = 0;
            })
            .on('changev2', ({ state, event }) => {
                const { change } = state;
                const { list, direction, onSwiperMoving } = this.mixProps;
                if (state.direction == direction) {
                    event.preventDefault();
                    touch.stopPropagation && event.stopPropagation();
                    // 处理在切换过程中，手动打断动画的情况
                    // if (this.transitioning) {
                    //     initX = +getComputedStyle(this.$s).transform.match(/\((.+)\)/)[1].split(',')[4]
                    //     toggleTransition(this.$s, false)
                    //     this.timeout.clear()
                    //     this.transitioning = false
                    // }
                    util.RAF(() => {
                        const C = this.getChange(change);
                        // 处理只有两个元素
                        if (list.length == 2) {
                            this.handleLen2Case(C);
                        }
                        this.$s.style.cssText += this.transform(`${(this.fixChange(C + initX) / this.max) * 100}%`);
                        onSwiperMoving(C, this.state.current);
                    });
                    this.mixProps.touch?.onChange?.({ state });
                }
            })
            .on('endv2', ({ done, state }) => {
                const { change } = state;
                const { direction } = this.mixProps;

                if (state.direction === direction) {
                    util.RAF(() => {
                        const C = this.getChange(change) + initX;
                        const isEqMax = Math.abs(this.fixChange(C)) === this.max;
                        let changeIndex = 100;
                        if (C > touch.distance) {
                            changeIndex = -1;
                            this.go(-1, isEqMax);
                        } else if (C < -touch.distance) {
                            changeIndex = 1;
                            this.go(1, isEqMax);
                        } else if (C != 0) {
                            changeIndex = 0;
                            this.go(0);
                        }

                        if (changeIndex != 100) {
                            this.mixProps.touch?.onEnd?.(this.fixIndex(this.state.current + changeIndex), { state });
                        }
                    });
                }
                done();
            })
            .on('nativeEnd', () => {
                this.startAutoPlay();
            });
    }

    // 阻止自动播放
    stopAutoPlay = () => {
        clearInterval(this.autoPlayInterval);
    };

    // 开启自动播放
    startAutoPlay = () => {
        this.stopAutoPlay();
        // 不执行自动播放
        if (!this.mixProps.autoPlay) {
            return;
        }
        this.autoPlayInterval = setInterval(() => {
            this.go(1);
        }, this.mixProps.autoPlayTime);
    };

    // 监听页面隐藏事件
    addPageListener = () => {
        if (!this.mixProps.autoPlay || !this.mixProps.pageHideDisableAutoPlay) {
            return;
        }
        // 页面隐藏后关闭自动播放，否则开启
        this.pageListener = () => {
            if (document.visibilityState === 'visible') {
                this.startAutoPlay();
            } else {
                this.stopAutoPlay();
            }
        };
        document.addEventListener('visibilitychange', this.pageListener);
    };

    removePageListener = () => {
        document.removeEventListener('visibilitychange', this.pageListener);
    };

    // 设置缩放
    setPinch() {
        if ((this.pinch && !this.pinch.destroy) || !this.$dom) {
            return;
        }

        this.pinch = new Pinch(this.$dom, this.getScaleTarget(this.$current))
            .on('nativeStart', () => {
                this.stopAutoPlay();
            })
            .on('start', () => {
                this.resetMax();
            })
            .on('change', (change, state) => {
                const { list, direction } = this.mixProps;
                const C = state.direction !== direction ? 0 : this.getChange(change);
                if (this.isCanMove(change) && list.length == 2) {
                    // 处理只有两个元素，需要根据活动方向动态调整位置
                    this.handleLen2Case(C);
                }
                this.$s.style.cssText += this.transform(`${C}px`);
            })
            .on('end', (change, state) => {
                const { direction, touch } = this.mixProps;
                if (state.direction === direction && this.isCanMove(change)) {
                    const C = this.getChange(change);
                    if (C > touch.distance) {
                        this.go(-1);
                    } else if (C < -touch.distance) {
                        this.go(1);
                    } else {
                        this.go(0);
                    }
                }
                this.startAutoPlay();
            });
        this.touchEvent = this.pinch.touch;
    }

    // 重置dom style
    setDOMStyle() {
        const currentIndex = this.useHighPerformance ? this.currentItemOffset : this.state.current;

        // 移除transform属性，避免动态添加元素不渲染
        this.$s.style.cssText += ';transform: none;';
        Array.from(this.$s.children).forEach(($container, index, arr) => {
            if (index == currentIndex) {
                const { $current: prevContainer } = this;
                this.$current = $container;
                prevContainer !== $container && this.resetPinch();
            }

            let domOffset = index - currentIndex;
            if (arr.length >= 3) {
                // 最后一个，第一个指定位置
                if (currentIndex == arr.length - 1 && index == 0) {
                    domOffset = 1;
                } else if (currentIndex == 0 && index == arr.length - 1) {
                    // 第一个，指定最后一个的位置
                    domOffset = -1;
                }
            }

            // 当前元素始终处在可视区域内
            const newStyle = this.handlePosition(`${domOffset * 100}%`, domOffset);

            const [BEFORE, CURRENT, NEXT] = ['prev-item', 'current-item', 'next-item'];
            // ;[BEFORE, CURRENT, NEXT].forEach(name => {
            //     $container.classList.remove(name)
            // })

            let className = '';
            if (domOffset === 0) {
                className = CURRENT;
            } else if (domOffset > 0) {
                className = [NEXT, NEXT + Math.abs(domOffset)].join(' ').trim();
            } else if (domOffset < 0) {
                className = [BEFORE, BEFORE + Math.abs(domOffset)].join(' ').trim();
            }
            $container.className = className;

            // 中间位置元素不绝对定位
            $container.style.cssText += `;
                position: ${domOffset === 0 ? 'relative' : 'absolute'};
                ${this.setStyle(newStyle)};
            `;
        });

        this.handleLen2Case(-1);
    }

    // 监听键盘事件
    addKeyEvents() {
        this.$dom.focus();
        this.$dom.addEventListener('keydown', (event) => {
            switch (event.keyCode) {
                case 39:
                    this.go(1);
                    break;
                case 37:
                    this.go(-1);
                    break;
                case 27:
                    this.close && this.close();
                    break;
                default:
            }
        });
    }

    // 动画时长
    go(indexChange = 0, noAnimation = false) {
        if (this.transitioning) {
            return;
        }

        this.mixProps.onBeforeChange?.();

        // 如果长度为1，不能切换
        if (this.mixProps.list.length < 2) {
            indexChange = 0;
        }

        // 超出范围了
        const { current } = this.state;
        const newCurrent = this.fixIndex(current + indexChange);

        const execAnimate = () => {
            if (!noAnimation) {
                toggleTransition(this.$s);
                this.$s.clientHeight;
            }
            // TODO: 要禁止的应该是事件的业务响应，而非直接禁止，因为还要阻止默认事件呢
            // 禁止手势触摸，避免一些不必要的问题
            this.touchEvent?.disable();
            this.transitioning = true;
            this.$s.style.cssText += this.transform(this.handlePosition(`${-indexChange * 100}%`, -indexChange));

            this.timeout.add(
                () => {
                    toggleTransition(this.$s, false);
                    this.setState({ current: newCurrent }, () => {
                        this.touchEvent?.enable();
                        this.transitioning = false;
                        if (newCurrent !== current) {
                            this.setDOMStyle();
                            this.mixProps.onChange(newCurrent, indexChange);
                            window.dispatchEvent(new Event('scroll'));
                        }
                        // 需要触发scroll时间，否则lazyImage不会加载
                    });
                },
                !noAnimation ? 300 : 0
            );
        };

        // 如果change长度大于2，就先移动到目标位置的上一个
        if (Math.abs(indexChange) > 1) {
            this.setState(
                {
                    current: this.fixIndex(current + indexChange + (indexChange > 0 ? -1 : 1)),
                },
                () => {
                    this.setDOMStyle();
                    execAnimate();
                }
            );
        } else {
            execAnimate();
        }
    }

    /**
     * 获取可以渲染的index集合
     * @returns
     * @memberof Swiper
     */
    getCanRenderArr() {
        const { list } = this.mixProps;
        const { current } = this.state;

        if (this.useHighPerformance) {
            return Array.from({ length: this.cacheDOMLen }).map((i, index) =>
                this.fixIndex(index + current - this.currentItemOffset)
            );
        }

        return list.map((i, index) => index);
    }

    get isLR() {
        return this.mixProps.direction === 'lr';
    }

    get rooStyle() {
        const { style } = this.mixProps;
        // swiper本身可以不在意与滚动方向垂直方向的尺寸
        const overflow = this.isLR
            ? {
                  overflowX: 'visible',
                  overflowY: 'unset',
              }
            : {
                  overflowX: 'unset',
                  overflowY: 'visible',
              };

        return {
            outline: 'none',
            ...overflow,
            ...style,
        };
    }

    render() {
        const { list, S = {} } = this.mixProps;
        const { current } = this.state;

        return (
            <div
                ref={(d) => {
                    this.$dom = d;
                }}
                style={this.rooStyle}
                className={this.className}
                tabIndex="0" // 想要键盘控制
            >
                <div
                    className={S.container}
                    ref={(d) => {
                        this.$s = d;
                    }}
                    style={{ position: 'relative', height: '100%', willChange: 'transform' }}
                >
                    {this.getCanRenderArr().map((index) => (
                        <div
                            key={index} // 此处用index作为key合适吗？，似乎是合适的，因为我们想要的是固定的渲染容器而已
                        >
                            {this.mixProps.renderItem(list[index], index, current)}
                        </div>
                    ))}
                </div>
                {this.mixProps.renderChildren({ current, list })}
            </div>
        );
    }
}
