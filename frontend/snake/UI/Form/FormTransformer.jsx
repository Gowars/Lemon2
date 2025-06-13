import React, { useContext } from 'react';
import { FormContext } from './helper';

/**
 * 只要其子组件可接受{onChange, value}两个props，即可将其转化为Form的一个子元素
 * 从而通过name来自动从context获取value
 * 以简化form表单的编程
 * @param {{ onChange: Function, name: string, value: any }} props
 * @returns
 */
export function FormTransformer(props) {
    const ctx = useContext(FormContext);
    let formValue, handleChange;
    if (ctx) {
        formValue = ctx.value[props.name];
        handleChange = ctx.handleChange;
    } else {
        formValue = props.value;
        handleChange = (_, v) => props.onChange(v);
    }

    const handleInput = (newValue) => {
        handleChange(props.name, newValue);
    };

    return React.cloneElement(props.children, {
        value: formValue,
        onChange: handleInput,
    });
}

export function pickFormExchangeProps(props) {
    return {
        name: props.name,
        value: props.value,
        onChange: props.onChange,
    };
}
