import React, { useContext, createContext } from 'react';
import { FormContext } from './helper';

const radioGroupContext = createContext();

/**
 * @param {React.InputHTMLAttributes} props
 * @returns
 */
export function RadioGroup(props) {
    const { name, children, renderError, ...otherProps } = props;
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
            {children}
            {error?.[name] && renderError ? renderError(error?.[name]) : null}
        </radioGroupContext.Provider>
    );
}

/**
 * @param {React.InputHTMLAttributes} props
 * @returns
 */
export function Radio(props) {
    const { value, children, ...others } = props;
    const { name, value: fieldValue, handleChange } = useContext(radioGroupContext);

    const handleInput = () => {
        handleChange(name, value);
    };

    return (
        <label {...others} className="ui-flex-a mr10 pointer">
            <input type="radio" checked={fieldValue === value} onChange={handleInput} name={name} className="mr5" />
            {children}
        </label>
    );
}
