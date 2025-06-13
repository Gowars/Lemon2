import React, { Component, createRef } from 'react';
import Touch from '../../core';
import { getProps } from '@/lemon-tools/getProps';

function getScrollTop(ele, container) {
    // https://stackoverflow.com/questions/19618545/body-scrolltop-vs-documentelement-scrolltop-vs-window-pageyoffset-vs-window-scro
    // document.body.scrollTop 在某些浏览器上已经被废除
    if (ele === document.body) {
        return document.documentElement.scrollTop || ele.scrollTop || window.scrollX || 0;
    }
    if (ele instanceof HTMLElement) {
        return ele.scrollTop;
    }
    return container.querySelector(ele)?.scrollTop;
}

const TRANSITON = {
    disable: 'transition: none;',
    enable: 'transition: transform .3s;',
};

const defaultProps = {
    onRefresh: () => {},
    target: document.body,
    className: '',
    disable: false,
    height: 100,
};

/**
 * @extends {Component<defaultProps, {}>}
 */
export default class PullToClose extends Component {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    get scrollTop() {
        return getScrollTop(this.mixProps.target, this.rootRef.current);
    }

    componentDidMount() {
        this.touch = new Touch(this.rootRef.current, {
            preventDefault: false,
            // 判断是否忽略touch事件
            checkTouchLimit: (direction, change) => {
                // 没有禁用，方向向下 scrollTop为0
                if (!this.mixProps.disable && direction === 'ud' && this.scrollTop == 0 && change > 0) {
                    this.transform(0, TRANSITON.disable);
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
                this.transform(Math.max(y, 0));
            })
            .on('endv2', ({ done, state }) => {
                const { change } = state;
                done();
                if (change.y > this.mixProps.height) {
                    this.mixProps.onClose(change.y);
                } else {
                    this.endRefresh();
                }
            });
    }

    componentWillUnmount() {
        this.touch.destroy();
    }

    transform = (y, otherStyle = '') => {
        this.rootRef.current.style.cssText += [otherStyle, `transform: translate(0, ${y}px);`].join('');
    };

    endRefresh = () => {
        this.transform(0, TRANSITON.enable);
    };

    rootRef = createRef();

    render() {
        const { className, children } = this.mixProps;

        return (
            <div className={className} ref={this.rootRef}>
                {children}
            </div>
        );
    }
}
