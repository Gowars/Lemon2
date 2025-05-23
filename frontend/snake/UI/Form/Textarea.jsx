import React, { useContext, useEffect, useRef } from 'react';
import { renderFunctionChild, FormContext } from './helper';
import cx from '@/lemon-tools/cx';
import { getProps } from '@/lemon-tools/getProps';
import { findParent } from '@/lemon-tools/domUtil';

const defaultProps = {
    /** 最小高度 */
    minHeight: '3em',
    /** 是否自适应高度 */
    autoHeight: false,
    /** 渲染错误提示 */
    renderError: false,
    /** field name */
    name: '',
};

/**
 * @param {defaultProps & React.TextareaHTMLAttributes} props
 * @returns
 */
export function Textarea(props) {
    const mixProps = getProps(props, defaultProps);
    const {
        minHeight = '3em',
        onChange,
        name,
        children,
        placeholder = '',
        autoHeight,
        renderError,
        ...otherProps
    } = mixProps;
    const formCtx = useContext(FormContext);
    // const { value: formValue, handleChange, handleFocus, error } = useContext(FormContext);
    let formValue, handleChange, handleFocus, error;
    if (formCtx) {
        formValue = formCtx.value;
        handleChange = formCtx.handleChange;
        handleFocus = formCtx.handleFocus;
        error = formCtx.handleFocus;
    } else {
        formValue = otherProps.value;
        error = {
            [name]: otherProps.fieldError,
        };
    }

    const fieldValue = formValue[name] || otherProps.value || '';
    const fieldError = error[name] || otherProps.error;
    const ref = useRef(null);

    const handleInput = (e) => {
        const { value: newValue } = e.target;
        onChange && onChange(newValue);
        handleChange && handleChange(name, newValue);
    };

    useEffect(() => {
        if (autoHeight) {
            const restoreScrollTop = (fn) => {
                const d = findParent(ref.current, (d) => {
                    return d.classList.contains('scroller') || d === document.documentElement
                })
                const prev = d.scrollTop
                console.log({ prev })
                fn()
                d.scrollTop = prev
            }
            restoreScrollTop(() => {
                ref.current.style.cssText += `
                    height: 0px;
                `;
                ref.current.style.cssText += `
                    min-height: ${minHeight};
                    height: ${ref.current.scrollHeight}px;
                `;
            })
        }
    }, [fieldValue]);

    return (
        <>
            {renderFunctionChild(children, [
                {
                    value: fieldValue,
                    error: fieldError,
                },
            ])}
            <textarea
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                {...otherProps}
                className={cx('ui-flex1', otherProps.className)}
                value={fieldValue}
                placeholder={placeholder}
                onChange={handleInput}
                ref={ref}
                style={{ padding: '0.5em', minHeight }}
                onFocus={(event) => {
                    handleFocus && handleFocus(name, true);
                    otherProps.onFocus && otherProps.onFocus(event);
                }}
                onBlur={(event) => {
                    handleFocus && handleFocus(name, false);
                    otherProps.onBlur && otherProps.onBlur(event);
                }}
            />
            {error?.[name] && renderError ? renderError(error?.[name]) : null}
        </>
    );
}
