import React, { createRef } from 'react';
import { getParent, listenScroll } from '../../util';
import { getProps } from '@/lemon-tools/getProps';
import cx from '@/lemon-tools/cx';
import observeNode, { observeView } from '../observeNode';
import './index.module.scss';

const defaultProps = {
    /** 参考高度 或者选择器 */
    top: 0,
    /** 当fixed状态发生变换时触发 */
    onStateChange: () => 0,
    holderClassName: '',
    className: '',
    children: null,
    $root: '.page-root',
    disabled: false,
    zIndex: 100,
};

/**
 * @extends {React.Component<defaultProps, {}>}
 */
export default class Sticky extends React.Component {
    static STATUS_FIXED = 'fixed';

    state = {
        isFixed: false,
        top: 0,
    };

    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    componentDidMount() {
        if (this.mixProps.disabled) return;

        this.remove = this.watch();
    }

    componentWillUnmount() {
        this.remove && this.remove();
    }

    watch = () => {
        const { holderRef, fixedRef } = this;

        const checkIsNeedUpdate = () => {
            const { width } = holderRef.current.getBoundingClientRect();
            return width !== 0;
        };

        // 更新高度，保证内容和holder高度一致
        const updateHeight = () => {
            if (fixedRef.current && holderRef.current && checkIsNeedUpdate()) {
                const height = fixedRef.current.clientHeight;
                holderRef.current.style.cssText += `;height: ${height}px;`;
            }
        };
        updateHeight();

        const scrollHanlder = () => {
            if (holderRef.current && checkIsNeedUpdate()) {
                const { top } = holderRef.current.getBoundingClientRect();

                const relativeTop = this.getTop(this.mixProps.top, holderRef.current);
                const isFixed = top < relativeTop;

                const { isFixed: prevFixed, top: prevTop } = this.state;

                if (prevFixed !== isFixed || prevTop !== relativeTop) {
                    this.setState({
                        isFixed,
                        top: relativeTop,
                    });

                    prevFixed !== isFixed &&
                        this.mixProps.onStateChange &&
                        this.mixProps.onStateChange({ status: isFixed ? Sticky.STATUS_FIXED : '' });
                }
            }
        };

        const timer = setTimeout(scrollHanlder, 50);
        // 监听scroll事件
        const removes = [
            observeView(holderRef.current, scrollHanlder),
            listenScroll(scrollHanlder),
            observeNode(fixedRef.current, updateHeight),
        ];

        return () => {
            removes.forEach((i) => i());
            clearTimeout(timer);
        };
    };

    /**
     * 根绝相对定位元素，获取fixed top值
     * @param {*} defaultTop
     * @param {*} dom
     * @returns
     */
    getTop(defaultTop, dom) {
        // 返回默认值，对全屏webview需要特殊处理
        if (!defaultTop) return 0;

        // 数字
        if (/^\d+(.\d+)?$/.test(`${defaultTop}`)) return Number(defaultTop);

        // 或者是一个选择器
        const relativeDom = getParent(dom, this.mixProps.$root).querySelector(defaultTop);

        if (relativeDom) {
            const { top, height } = relativeDom.getBoundingClientRect();

            // 获取到的数据可能是不稳定的，带有不稳定的小数
            return Math.floor(top + height);
        }

        return 0;
    }

    holderRef = createRef();

    fixedRef = createRef();

    render() {
        const { holderClassName, className, children } = this.mixProps;
        const { isFixed, top } = this.state;

        if (this.mixProps.disabled) return children;

        return (
            <div
                className={cx(
                    'sticky-outer-wrapper',
                    isFixed ? 'sticky-status-fixed' : 'sticky-status-static',
                    className
                )}
            >
                <div ref={this.holderRef} className={cx('sticky-holder', holderClassName)} />
                <div
                    className={cx('sticky-inner-wrapper')}
                    ref={this.fixedRef}
                    style={{ top, zIndex: this.mixProps.zIndex }}
                >
                    {children}
                </div>
            </div>
        );
    }
}
