import cx from '@/lemon-tools/cx';
import React from 'react';
import { FormTransformer, pickFormExchangeProps } from '../FormTransformer';

import S from './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    value: false,
    onChange: () => {},
    inactiveColor: '#dcdfe6',
    activeColor: 'var(--theme-color)',
};

/**
 *
 * @param {defaultProps} props
 * @returns
 */
export function SwitchCore(props) {
    const mixProps = getProps(props, defaultProps);
    return (
        <div
            className={cx(S['ui-switch'], mixProps.value && S['checked'])}
            onClick={() => mixProps.onChange(!mixProps.value)}
            style={{
                color: mixProps.value ? mixProps.activeColor : mixProps.inactiveColor,
            }}
        />
    );
}

/**
 *
 * @param {defaultProps} props
 * @returns
 */
export function Switch(props) {
    return (
        <FormTransformer {...pickFormExchangeProps(props)}>
            <SwitchCore {...props} />
        </FormTransformer>
    );
}
