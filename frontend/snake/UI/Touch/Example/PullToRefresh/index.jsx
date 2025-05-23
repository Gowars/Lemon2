import React, { useEffect, useRef, useState } from 'react';
import Touch from '../../core';

import S from './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';
import cx from '@/lemon-tools/cx';
import { findParent } from '@/lemon-tools/domUtil';
import { uuid } from '@/lemon-tools/uuid';

function getScrollTop(ele) {
    // https://stackoverflow.com/questions/19618545/body-scrolltop-vs-documentelement-scrolltop-vs-window-pageyoffset-vs-window-scro
    // document.body.scrollTop 在某些浏览器上已经被废除
    let top = 0;
    const getBodyTop = () => document.documentElement.scrollTop || ele.scrollTop || window.scrollY || 0;
    if ([window, document.body, document.documentElement].includes(ele)) {
        top = getBodyTop();
    } else if (ele instanceof HTMLElement) {
        // 如果元素没有开启滚动属性，则回退到body逻辑上
        top = ele.scrollTop;
    } else if (typeof ele == 'string') {
        top = document.querySelector('.' + ele)?.scrollTop || 0;
    }
    return Math.max(top, 0) || 0;
}

const TRANSITON = {
    disabled: 'transition: none;',
    enable: 'transition: height .3s;',
};

const defaultProps = {
    onRefresh: () => {},
    /** 监听touch事件 */
    target: document.body,
    /** 监听scroll事件 */
    scroller: document.body,
    className: '',
    /** 下拉暂停时间 */
    pendingTime: 800,
    disabled: false,
    /** 高度 */
    height: 60,
    background: '',
    text: {
        will: '下拉刷新',
        enough: '释放更新',
        pending: '加载中···',
    },
};

/**
 *
 * @param {defaultProps} props
 * @returns
 */
export function PullToRefresh(props) {
    const mixProps = getProps(props, defaultProps);
    const refreshRef = useRef();
    const textRef = useRef();

    useEffect(() => {
        const realHeight = (y) => Math.max(y ** 0.85, 0); // 提供阻尼感
        const $touchDOM =
            mixProps.target instanceof HTMLElement
                ? mixProps.target
                : findParent(refreshRef.current, (d) => {
                      return d.classList.contains(mixProps.target);
                  });
        if (!$touchDOM) return;
        const transform = (y, otherStyle = '') => {
            refreshRef.current.style.cssText += [otherStyle, `height: ${y}px;`].join('');
        };
        const updateText = (text) => {
            if (textRef.current) {
                textRef.current.textContent = text;
            }
        };
        const endRefresh = () => transform(0, TRANSITON.enable);
        const getTop = () => getScrollTop(mixProps.scroller);

        const touch = new Touch($touchDOM, {
            preventDefault: false,
            // 判断是否忽略touch事件
            checkTouchLimit: (direction, change, event) => {
                let isMatch = true;
                findParent(event.target, (d) => {
                    if (!$touchDOM.contains(d)) {
                        return true;
                    }
                    if (Math.floor(getScrollTop(d)) > 0) {
                        isMatch = false;
                        return true;
                    }
                });

                if (!isMatch) {
                    return true;
                }

                // 没有禁用，方向向下 scrollTop为0
                if (!mixProps.disabled && direction === 'ud' && getTop() == 0 && change > 0) {
                    transform(0, TRANSITON.disabled);
                    event.preventDefault();
                    return false;
                }
                return true;
            },
        })
            .on('changev2', ({ state, event }) => {
                const { y } = state.change;
                event.preventDefault();
                event.stopPropagation();
                // 做一个阻尼效果
                transform(realHeight(y));
                const { height, text } = mixProps;
                updateText(realHeight(y) > height ? text.enough : text.will);
            })
            .on('endv2', ({ done, state }) => {
                done();
                const { change } = state;
                const { height, text } = mixProps;
                if (realHeight(change.y) > height) {
                    transform(height, TRANSITON.enable);
                    updateText(text.pending);
                    mixProps.onRefresh(change.y);
                    setTimeout(endRefresh, mixProps.pendingTime);
                } else {
                    endRefresh();
                }
            });
        return touch.destroy;
    }, [mixProps.disabled]);

    return (
        <div className={cx(S.holder, mixProps.className)} ref={refreshRef} style={mixProps.style}>
            <div className={S.content} ref={textRef} />
        </div>
    );
}

export function useRefreshClass() {
    const [id] = useState('refresh-' + uuid(12));
    return id;
}
