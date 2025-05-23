import { useContext } from 'react';
import { createContext } from 'react';

export const FormContext = createContext();

export function renderFunctionChild(children, params = []) {
    if (typeof children === 'function') {
        return children(...params);
    }
    return children;
}

export function useFormContext() {
    return useContext(FormContext)
}
