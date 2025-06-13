import React, { Component } from 'react';
import Touch from '../core';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    className: '',
    /** 禁用 */
    disabled: false,
    /** 处理状态变化 */
    onChange: () => {},
};

/**
 * @extends {Component<defaultProps, {}>}
 */
export default class Swipe extends Component {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    state = {
        active: false,
    };

    componentDidMount() {
        let x = 0;
        new Touch(this.dom, {
            preventDefault: false,
        })
            .on('nativeStart', () => {
                this.helpWidth = this.dom.lastElementChild.offsetWidth;
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

    fixChange(change) {
        return Math.max(-this.helpWidth, Math.min(0, change));
    }

    changeTrans(x, animation = false) {
        if (this.mixProps.disabled) return;
        x = this.fixChange(x);

        if (!animation) {
            this.dom.style.cssText += `
                transition: none;
            `;
        } else {
            this.dom.style.cssText += `
                transition: transform .3s;
            `;
            this.dom.clientHeight;
        }
        this.dom.style.cssText += `
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

    setRef = (d) => {
        this.dom = d;
    };

    render() {
        const { className } = this.mixProps;

        return (
            <div className={className} ref={this.setRef}>
                {this.mixProps.children}
            </div>
        );
    }
}
