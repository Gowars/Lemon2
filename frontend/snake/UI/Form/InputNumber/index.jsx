import React, { useContext } from 'react';
import { FormContext } from '../helper';
import cx from '@/lemon-tools/cx';

import S from './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    name: '',
    value: 1,
    step: 1,
    min: 100,
    max: Infinity,
    onChange: () => {},
    disabled: false,
    placeholder: '',
    allowInput: true,
};

/**
 *
 * @param {defaultProps} props
 * @returns
 */
export function InputNumber(props) {
    const mixProps = getProps(props, defaultProps);

    const { name, ...otherProps } = mixProps;
    const formCtx = useContext(FormContext);
    let value, handleChange;

    const fixValue = (v) => {
        const x = Math.min(Math.max(v, mixProps.min), mixProps.max);
        return x;
    };

    if (formCtx) {
        value = formCtx.value[name];
        handleChange = formCtx.handleChange;
    } else {
        value = otherProps.value;
        handleChange = (_, v) => otherProps.onChange(v);
    }

    const handleInput = (e) => {
        const { value } = e.target;
        handleChange(name, Number(value) || 0);
    };

    const handleBlur = () => {
        handleChange(name, fixValue(Number(value) || 0));
    };

    return (
        <div className={cx(S.inputNumber, mixProps.disabled && S.disabled)}>
            <span onClick={() => handleChange(name, fixValue(value - mixProps.step))}>-</span>
            <input
                type="number"
                value={value}
                onChange={handleInput}
                onBlur={handleBlur}
                placeholder={mixProps.placeholder}
                readOnly={!mixProps.allowInput}
            />
            <span onClick={() => handleChange(name, fixValue(value + mixProps.step))}>+</span>
        </div>
    );
}
