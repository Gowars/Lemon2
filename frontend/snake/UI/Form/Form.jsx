import React, { useCallback, useEffect, useState } from 'react';
import { renderFunctionChild, FormContext } from './helper';
import { getProps } from '@/lemon-tools/getProps';
import { clone } from '@/lemon-tools/clone';

function getChain(str) {
    const arr = []
    let index = 0
    while (str[index]) {
        if (str[index] == '[') {
            const res = str.slice(index).match(/^\[[^\]]+\]/)
            if (res) {
                arr.push({
                    type: 'array',
                    value: res[0].slice(1, -1),
                    raw: res[0],
                })
                index += res[0].length
                continue
            }
        } else if (str[index] == '.') {
            index += 1
            continue
        } else {
            const res = str.slice(index).match(/^[^.[]+/)
            if (res) {
                arr.push({
                    type: 'object',
                    value: res[0]
                })
                index += res[0].length
                continue
            }
        }  
        index += 1
    }
    return arr
}

function getV(parent, name, nameAsExpr) {
    if (nameAsExpr) {
        return getChain(name).reduce((prev, item) => {
            return prev[item.value]
        }, parent)
    }
    return parent[name]
}

function setV(parent, name, value, nameAsExpr) {
    if (nameAsExpr) {
        return getChain(name).reduce((prev, item, index, arr) => {
            if (arr.length == index + 1) {
                prev[item.value] = value
            }
            return prev[item.value]
        }, parent)
    }
    parent[name] = value
    return value
}

const defaultProps = {
    /** 监听数据变化 */
    onChange: () => {},
    /** 校验数据是否有问题 */
    valid: () => null,
    /** 对数据进行修改 */
    beforeChange: (any) => any,
    /** form表单值 */
    value: {},
    /** 表单class */
    className: '',
    /** 是否自动添加form根标签 */
    noRoot: false,
    /** label标签宽度 */
    labelWidth: '',
};

/**
 * @export
 * 可以通过defaultProps添加代码智能提示，对于class组件也是可以如此操作的
 * @param {defaultProps} props
 * @returns
 */
export function Form(props) {
    const mixProps = getProps(props, defaultProps);
    const [errorState, setError] = useState({});
    const [focusState, setFocus] = useState('');

    const handleChange = useCallback(
        (key, newValue) => {
            let nextForm = clone(mixProps.value);
            setV(nextForm, key, newValue, mixProps.nameExpr)
            nextForm = mixProps.beforeChange(nextForm);
            mixProps.onChange(nextForm, mixProps.value);
        },
        [mixProps]
    );

    const handleFocus = (name, isFocus = true) => {
        isFocus ? setFocus(name) : setFocus('');
    };

    const contextValue = {
        handleChange,
        handleFocus,
        value: mixProps.value,
        error: errorState || {},
        focus: focusState,
        labelWidth: mixProps.labelWidth,
        nameExpr: mixProps.nameExpr, // name作为表达式，而不是key
        getV: (name) => {
            return getV(mixProps.value, name, mixProps.nameExpr)
        }
    };

    const handleSubmit = (event) => {
        // console.log(event)
        event.preventDefault();
        // mixProps.onSubmit && mixProps.onSubmit();
    };

    useEffect(() => {
        const error = mixProps.valid && mixProps.valid(mixProps.value);
        setError(error);
    }, [mixProps.value]);

    const children = renderFunctionChild(mixProps.children, [contextValue]);

    return (
        <FormContext.Provider value={contextValue} >
            {mixProps.noRoot ? (
                children
            ) : (
                <form onSubmit={handleSubmit} className={mixProps.className}>
                    {children}
                </form>
            )}
        </FormContext.Provider>
    );
}
