import React, { PureComponent } from 'react';
import RX from '@/lemon-tools/RX';

import S from './index.module.scss';
import cx from '@/lemon-tools/cx';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    /** 是否显示loading */
    loading: false,
    /** loading显示文案 */
    loadingText: '',
    /** 禁用 */
    disabled: false,
    /** 禁用提示文案 */
    disabledText: '',
    /** 禁用提示文案 */
    className: '',
    type: '',
    // disabledTips: '', // 禁用弹窗提示文案
    throttle: 800,
    title: '',
    onClick: () => {},
    style: null,
};

/**
 * @extends {PureComponent<defaultProps & React.ButtonHTMLAttributes<{}>, {}>}
 */
export default class Button extends PureComponent {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }
    handleClick = RX.throttle((e) => {
        if (this.mixProps.disabled) return;

        // 如果返回的结果为Promise，则会切换到loading状态
        this.mixProps.onClick(e);
        // eslint-disabled-next-line react/destructuring-assignment
    }, this.mixProps.throttle);

    get child() {
        const { loading, loadingText, disabled, disabledText, children } = this.mixProps;
        if (disabled && disabledText) {
            return disabledText;
        }

        if (loading && loadingText) {
            return loadingText;
        }

        return children;
    }

    render() {
        const { loading, type = 'button', disabled, className, title = '', style } = this.mixProps;

        return (
            // eslint-disable-next-line react/button-has-type
            <button
                className={cx(
                    S.btn,
                    className,
                    disabled && S.disabled,
                    S['theme-' + this.mixProps.theme] || S['theme-common']
                )}
                onClick={this.handleClick}
                disabled={disabled}
                style={style}
                type={type}
                title={title}
            >
                <span className={cx(loading && S.loading)}>{this.child}</span>
            </button>
        );
    }
}
