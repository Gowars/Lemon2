import React, { useEffect, useRef } from 'react';

import './index.module.scss';

import HotKey from '@/lemon-tools/hotkeys';
import { modalRecord } from '../modalRecord';
import { StopScroll } from '@/lemon-tools/scroll/stopScroll';
import { getProps } from '@/lemon-tools/getProps';
import { CSSTransition } from '@/snake/UI/CSSTransition';
import cx from '@/lemon-tools/cx';
import { uuid } from '@/lemon-tools/uuid';

const defaultProps = {
    /** 是否显示弹窗 */
    show: false,
    animationType: 'dd',
    animationTime: 300,
    /** 弹窗关闭回掉 */
    close: () => {},
    /** 弹窗layer点击是否可关闭 */
    layerClose: true,
    /** 是否展示layer */
    layer: true,
    /** 是否阻止页面滚动 */
    isStopBodyScroll: true,
    /** 目前仅用在向Core注入className，组件内部使用 */
    className: '',
};

/**
 * @param {defaultProps} props
 * @returns
 */
export default function CModal(props) {
    const mixProps = getProps(props, defaultProps);
    const { show, animationType } = mixProps;

    useEffect(() => {
        const key = uuid(32);
        modalRecord.push(key);
        const hk = new HotKey().on('esc', () => {
            modalRecord.check(key) && mixProps.close();
        });

        return () => {
            modalRecord.pop();
            hk.unmount();
        };
    }, []);

    // in为false时，不会渲染子元素，切换为true时候方才会渲染，并执行动画

    return (
        <CSSTransition
            in={show}
            timeout={300}
            classNames={`cmodal-${animationType}`}
            // onEntered={this.handleEnter}
            unmountOnExit
        >
            <Core {...mixProps}>{props.children}</Core>
        </CSSTransition>
    );
}

/**
 * @param {defaultProps} props
 * @returns
 */
function Core(props) {
    const mixProps = getProps(props, defaultProps);
    const { animationType } = mixProps;
    const layerRef = useRef();
    const contentRef = useRef();

    useEffect(() => {
        if (mixProps.isStopBodyScroll) {
            return new StopScroll([layerRef.current, contentRef.current]).on().off;
        }
    }, []);

    const handleClick = (e) => {
        e.stopPropagation();
        if (mixProps.layer && mixProps.layerClose && e.target === layerRef.current) {
            mixProps.close();
        }
    };

    useEffect(() => {
        /** @type { HTMLElement } */
        const ele = layerRef.current;
        const handler = (e) => {
            if (e.target === ele) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        ele.addEventListener('touchmove', handler, { passive: false });
        return () => {
            ele.removeEventListener('touchmove', handler, { passive: false });
        };
    }, []);

    // in为false时，不会渲染子元素，切换为true时候方才会渲染，并执行动画

    return (
        <div
            onClick={handleClick}
            ref={layerRef}
            className={cx(`cmodal-${animationType}`, mixProps.layer && 'layer', mixProps.className)}
        >
            <div className="content" ref={contentRef}>
                {props.children}
            </div>
        </div>
    );
}
