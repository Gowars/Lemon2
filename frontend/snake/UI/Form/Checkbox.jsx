import React, { useContext } from 'react';
import { renderFunctionChild, FormContext } from './helper';
import cx from '@/lemon-tools/cx';

/**
 * @param {React.InputHTMLAttributes} props
 * @returns
 */
export function CheckBox(props) {
    const { name, children, ...otherProps } = props;
    const formCtx = useContext(FormContext);
    let value, fieldError, handleChange;

    if (formCtx) {
        value = formCtx.value[name];
        fieldError = formCtx.error[name];
        handleChange = formCtx.handleChange;
    } else {
        value = otherProps.value;
        handleChange = (_, v) => otherProps.onChange(v);
        fieldError = otherProps.error;
    }

    const handleInput = (e) => {
        const { checked } = e.target;
        handleChange(name, checked);
    };

    return (
        <label className="ui-flex-a pointer mr10">
            <input
                {...otherProps}
                type="checkbox"
                checked={value}
                onChange={handleInput}
                className={cx('mr5', otherProps.className)}
            />
            {renderFunctionChild(children, [
                {
                    value: value,
                    error: fieldError,
                },
            ])}
        </label>
    );
}
