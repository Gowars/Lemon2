import React, { Component, createRef } from 'react';
import Touch from '../Touch/core';
import cx from '@/lemon-tools/cx';
import S from './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    className: '',
    disable: false, // 禁用
    onChange: () => {}, // 处理状态变化
    activeClassName: '',
    sideChild: null, // 右边元素
};

/**
 * @extends {Component<defaultProps, {}>}
 */
export default class RowSwipe extends Component {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    state = {
        active: false,
    };

    refRoot = createRef();

    refSide = createRef();

    componentDidMount() {
        let x = 0;
        const $root = this.refRoot.current;
        this.touch = new Touch($root, {
            preventDefault: false,
        })
            .on('nativeStart', () => {
                this.helpWidth = this.refSide.current.clientWidth;
                this.changeTrans(x);
            })
            .on('changev2', ({ state, event }) => {
                const { change } = state;
                if (state.direction == 'lr') {
                    event.preventDefault();
                    this.state.active && event.stopPropagation();
                    this.changeTrans(x + change.x);
                }
            })
            .on('endv2', ({ done, state }) => {
                const { change } = state;
                if (state.direction == 'lr') {
                    x += change.x;
                    if (change.x < (-1 / 3) * this.helpWidth) {
                        x = -this.helpWidth;
                        this.changeStatus(true);
                    } else {
                        x = 0;
                        this.changeStatus(false);
                    }
                }
                done();
            });
    }

    componentWillUnmount() {
        this.touch?.removeEvents();
    }

    fixChange(change) {
        return Math.max(-this.helpWidth, Math.min(0, change));
    }

    changeTrans(x, animation = false) {
        if (this.mixProps.disable) return;
        x = this.fixChange(x);
        const $root = this.refRoot.current;

        if (!animation) {
            $root.style.cssText += `
                transition: none;
            `;
        } else {
            $root.style.cssText += `
                transition: transform .3s;
            `;
            $root.clientHeight;
        }
        $root.style.cssText += `
            transform: translateX(${x}px);
        `;
    }

    changeStatus(active) {
        this.setState({
            active,
        });
        this.changeTrans(active ? -this.helpWidth : 0, true);
        this.mixProps.onChange(active);
    }

    render() {
        const { className } = this.mixProps;

        return (
            <div className={cx(className, S.UIRowSwipeWrap)}>
                <div className={cx(className, S.UIRowSwipe)} ref={this.refRoot}>
                    {this.mixProps.children}
                    <div className={S.UIRowSwipeExt} ref={this.refSide}>
                        {this.mixProps.sideChild}
                    </div>
                </div>
            </div>
        );
    }
}
