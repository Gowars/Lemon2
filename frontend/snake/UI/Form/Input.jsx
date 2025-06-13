import React, { forwardRef, useContext, useImperativeHandle, useRef } from 'react';
import { renderFunctionChild, FormContext } from './helper';
import cx from '@/lemon-tools/cx';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    name: '',
    /** 是否渲染错误信息 */
    renderError: false,
    onChange: null,
};

/**
 * @param {defaultProps & React.InputHTMLAttributes} props
 * @returns
 */
export const Input = forwardRef(function InputCore(props, ref) {
    const mixProps = getProps(props, defaultProps);
    const { onChange, name, children, placeholder = '', renderError, type = 'text', ...otherProps } = mixProps;
    const formCtx = useContext(FormContext);
    let formValue, handleChange, handleFocus, error;
    if (formCtx) {
        formValue = formCtx.value;
        handleChange = formCtx.handleChange;
        handleFocus = formCtx.handleFocus;
        error = formCtx.error;
    } else {
        formValue = otherProps.value;
        error = {
            [name]: otherProps.fieldError,
        };
    }
    // const { value: formValue, handleChange, handleFocus, error } = formCtx
    const fieldValue = (formCtx ? formCtx.getV(name) : formValue) || '';
    const fieldError = error[name];

    const handleInput = (e) => {
        let { value: newValue } = e.target;
        if (type == 'number') {
            newValue = newValue.trim().match(/^\d+(\.\d+)?/)?.[0] || '';
        }
        onChange && onChange(newValue, e);
        handleChange && handleChange(name, newValue);
    };

    useImperativeHandle(
        ref,
        () => {
            return {
                handleInput: (value) => {
                    handleInput({
                        target: { value },
                    });
                    domRef.current.focus();
                },
            };
        },
        [onChange, handleChange]
    );

    const domRef = useRef();

    return (
        <>
            {renderFunctionChild(children, [
                {
                    value: fieldValue,
                    error: fieldError,
                },
            ])}
            <input
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                type={type}
                {...otherProps}
                className={cx('ui-flex1', otherProps.className)}
                value={fieldValue}
                placeholder={placeholder}
                onChange={handleInput}
                onFocus={(event) => {
                    handleFocus && handleFocus(name, true);
                    otherProps.onFocus && otherProps.onFocus(event);
                }}
                onBlur={(event) => {
                    handleFocus && handleFocus(name, false);
                    otherProps.onBlur && otherProps.onBlur(event);
                }}
                ref={domRef}
            />
            {error?.[name] && renderError ? renderError(error?.[name]) : null}
        </>
    );
});
