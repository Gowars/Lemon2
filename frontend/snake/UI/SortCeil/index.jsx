import React, { useEffect, useRef } from 'react';
import { Touch } from './core';
import cx from '@/lemon-tools/cx';

import './index.scss';
import { revertStyle } from './revertStyle';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    className: '',
    disabled: false,
    data: null,
    onChange: () => null,
    index: 0,
    children: null,
    mode: 'list',
    onBeforeChange: undefined,
};

export default function SortCeil(p) {
    const props = getProps(p, defaultProps);
    const { className, disabled, data, onChange, index, children, onBeforeChange } = props;
    const domRef = useRef();
    const dataRef = useRef();
    dataRef.current = { data, index };

    useEffect(() => {
        if (disabled) return;
        let prev = undefined;
        const touch = new Touch(domRef.current, () => dataRef.current);
        touch.mode = props.mode;
        touch.onBeforeChange = (current, target, done) => {
            if (onBeforeChange) {
                onBeforeChange(current, target, done);
            } else {
                done(true);
            }
        };
        touch
            .on('change', (...params) => {
                onChange && onChange(...params);
            })
            .on('active', () => {
                prev = cloneSortElement(domRef.current);
            })
            .on('inactive', () => {
                if (prev) {
                    prev();
                    prev = undefined;
                }
            });
        domRef.current.touch = touch;

        setTimeout(() => {
            // 因为页面在被打开的时候，会被隐藏一下（display: none）
            // 导致Touch在实例化的过程中获取的坐标信息是不符合预期的，因此需要延迟执行
            touch.resetState();
        }, 50);

        return () => touch.destroy();
    }, [index, disabled]);

    return (
        <div className={cx('sort-ceil', !disabled && 'pageTouchIgnore', className)} ref={domRef}>
            {children}
        </div>
    );
}

/**
 * 1. 因元素要变为fixed定位，需记录元素的宽高等信息，以突破overflow对元素的遮挡
 * 2. 复制一个占位元素，保持页面结构稳定
 * @param {HTMLElement} dom
 * @returns
 */
function cloneSortElement(dom) {
    const { width, height, top, left } = dom.getBoundingClientRect();
    const html = dom.cloneNode(true);
    html.classList.remove('sort-ceil');
    html.classList.add('sort-ceil-hidden');
    dom.parentElement.insertBefore(html, dom);
    dom.classList.add('sort-active');

    const revert = revertStyle(dom, ['width', 'height', 'top', 'left']);

    dom.style.cssText += `
        width: ${width}px;
        height: ${height}px;
        top: ${top}px;
        left: ${left}px;
    `;

    return () => {
        dom.classList.remove('sort-active');
        revert();
        html.remove();
    };
}
