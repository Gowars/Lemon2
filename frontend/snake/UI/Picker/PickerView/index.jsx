import React, { useEffect, useRef } from 'react';
import Touch from '../../Touch/core';
import { EventBus } from '../../Touch/EventBus';
import S from './index.module.scss';
import { getOffset } from './offset';
import { getProps } from '@/lemon-tools/getProps';

class Select extends EventBus {
    $ele = document.body;

    $target = document.body;

    $border = document.body;

    MAX = 0;

    MIN = 0;

    position = 0;

    /**
     *
     * @param {HTMLElement} $ele
     * @param {HTMLElement} $target
     * @param {HTMLElement} $border
     */
    constructor($ele, $target = $ele.firstElementChild, $border = $ele.lastElementChild) {
        super();
        this.$ele = $ele;
        this.$target = $target;
        this.$border = $border;
        this.updateMaxMin();

        let liveP = 0;

        this.touch = new Touch($ele, {
            finger: 1,
            iosSystemSwipe: false,
            dispatchClick: true,
        })
            .on('nativeStart', () => {
                this.stopAnimation();
            })
            .on('changev2', ({ state }) => {
                const { change } = state;
                if (state.direction === 'ud') {
                    liveP = this.position + change.y;
                    this.updatePosition(`${liveP}px`);
                }
            })
            .on('endv2', ({ done, state }) => {
                const { change } = state;
                if (state.direction === 'ud') {
                    const newP = this.position + change.y + state.V.y * 100000;
                    this.animationTo(newP);
                }
                done();
            });
        this.addWheel();
    }

    unmount() {
        this.removeWheel();
        this.stopAnimation();
        this.touch.destroy();
    }

    /**
     * 添加滚动监听
     */
    addWheel() {
        const { $ele } = this;
        let timeout;
        const wheelHandler = (e) => {
            e.preventDefault();
            this.position = this.autoAdjust(this.position - e.deltaY);
            this.updatePosition(`${this.position}px`);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.animationTo(this.position);
            }, 160);
        };
        $ele.addEventListener('wheel', wheelHandler);

        // 移除滚动事件
        this.removeWheel = () => {
            clearTimeout(timeout);
            $ele.removeEventListener('wheel', wheelHandler);
        };
    }

    updateMaxMin = () => {
        const parentH = this.$ele.clientHeight;
        const childH = this.$target.clientHeight;

        this.MAX = 0;
        this.MIN = parentH - childH;
    };

    abosoluteP(currentPosition, prevPosition) {
        // 判断滚动方向
        const toUp = currentPosition <= prevPosition;
        let base = currentPosition;
        let newPosition = currentPosition;
        const { top: bTop, height: bHeight } = getOffset(this.$border);
        const children = Array.from(this.$target.children);
        let changeToIndex = 0; // 滚动到第几个元素
        let i = 0;
        // 计算出恰巧需要滚动的元素位置
        while (i < children.length) {
            const item = children[i];
            const { height } = item.getBoundingClientRect();

            if (toUp) {
                if (base >= bTop) {
                    if (base - bTop < (bHeight * 2) / 3) {
                        newPosition = currentPosition - (base - bTop);
                        changeToIndex = i;
                    } else {
                        newPosition = currentPosition + (bTop + bHeight - base);
                        changeToIndex = i - 1;
                    }
                    break;
                }
            } else if (base >= bTop) {
                if (base - bTop > bHeight / 3) {
                    newPosition = currentPosition + (bTop + bHeight - base);
                    changeToIndex = i - 1;
                } else {
                    newPosition = currentPosition - (base - bTop);
                    changeToIndex = i;
                }
                break;
            }
            i += 1;
            base += height;
        }

        return {
            newPosition,
            changeToIndex: Math.min(Math.max(changeToIndex, 0), children.length - 1),
        };
    }

    updatePosition(y, animation = false, callback) {
        this.stopAnimation();
        if (animation) {
            this.$target.style.cssText += ` transition: transform .3s; `;
            this.$target.clientHeight;
            setTimeout(callback, 320);
        } else {
            callback && callback();
        }

        this.$target.style.cssText += ` transform: translateY(${y}); `;
    }

    stopAnimation() {
        this.$target.style.cssText += `transition: none;`;
    }

    /**
     * 自动校正position
     * @param {number} position
     * @returns
     */
    autoAdjust(position) {
        return Math.max(Math.min(position, this.MAX), this.MIN);
    }

    // 滚动到指定位置
    animationTo(position, animation = true) {
        position = this.autoAdjust(position);
        const result = this.abosoluteP(position, this.position);
        position = result.newPosition;
        this.position = position;
        this.updatePosition(`${position}px`, animation, () => {
            this.trigger('change', result.changeToIndex);
        });
    }

    // 滚动到指定元素
    animationToIndex(index, animation = true) {
        const height = Array.from(this.$target.children)
            .slice(0, index)
            .map((item) => item.clientHeight)
            .reduce((prev, current) => prev + current, 0);

        this.animationTo(this.MAX - height, animation);
    }
}

const defaultProps = {
    title: '',
    /** 为datasource的每个数据指定key，以提升性能 */
    keyName: '',
    onChange: () => {},
    value: undefined,
    dataSource: [],
    renderChild: (text) => <div>{text}</div>,
    /** 显示多少行 */
    lines: 5,
};

/**
 *
 * @param {defaultProps} props
 * @returns
 */
export function PickerView(props) {
    const mixProps = getProps(props, defaultProps);
    const refEle = useRef();
    const refChild = useRef();
    const refBorder = useRef();
    const selectRef = useRef();

    useEffect(() => {
        const selecIndex = Math.max(Array.isArray(mixProps.value) ? mixProps.value[0] : mixProps.value, 0);
        const { top, bottom } = getOffset(refBorder.current);
        const select = new Select(refEle.current);
        select.MIN = refEle.current.clientHeight - refChild.current.clientHeight - bottom;
        select.MAX = top;

        select.animationToIndex(selecIndex, false);
        selectRef.current = select;
        refEle.current.style.cssText += 'opacity: 1;';

        select.on('change', (index) => {
            mixProps.onChange(index);
        });

        return () => {
            select.unmount();
            selectRef.current = null;
        };
    }, [mixProps.dataSource, mixProps.value]);

    const handleItemClick = (selecIndex) => () => {
        selectRef.current.animationToIndex(selecIndex, true);
    };

    return (
        <div ref={refEle} className={S.select} style={{ height: 3 * mixProps.lines + 'em' }}>
            <div className={S.range} ref={refChild}>
                {mixProps.dataSource.map((ele, index) => {
                    return (
                        <div key={mixProps.keyName ? ele[mixProps.keyName] : index} onClick={handleItemClick(index)}>
                            {mixProps.renderChild(ele, index)}
                        </div>
                    );
                })}
            </div>
            <div className={S.border} ref={refBorder} />
        </div>
    );
}
