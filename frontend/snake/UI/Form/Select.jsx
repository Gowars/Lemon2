import React, { useContext, createContext } from 'react';
import { FormContext } from './helper';
import cx from '@/lemon-tools/cx';
import ToolTip from '../ToolTip';

const radioGroupContext = createContext();

export function Select({ name, children, renderError, ...otherProps }) {
    const formCtx = useContext(FormContext);

    let value, handleChange, error;
    if (formCtx) {
        value = formCtx.value[name];
        handleChange = formCtx.handleChange;
        error = formCtx.error;
    } else {
        value = otherProps.value;
        handleChange = (_, v) => otherProps.onChange(v);
        error = otherProps.error;
    }

    return (
        <radioGroupContext.Provider value={{ value, name, handleChange }}>
            <div className="ui-flex1">
                <ToolTip position="bottom">
                    <div className="ui-flex1 lh40">{value || '请选择'}</div>
                </ToolTip>
                <div>{children}</div>
            </div>
            {error?.[name] && renderError ? renderError(error?.[name]) : null}
        </radioGroupContext.Provider>
    );
}

export function Option({ value, children }) {
    const { name, value: fieldValue, handleChange } = useContext(radioGroupContext);

    const handleInput = () => {
        handleChange(name, value);
    };

    return (
        <div className={cx((fieldValue == value) == 'checked', 'lh40')} onClick={handleInput}>
            {children}
        </div>
    );
}
