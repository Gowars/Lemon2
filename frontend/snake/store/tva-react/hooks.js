import { useEffect, useState } from 'react';
import * as React from 'react';
import { getState, subscribe } from '../tva-core/store';

/**
 * useTva 方便直接获取指定model的state
 * @export
 * @param {string} modelName
 * @returns
 */
// eslint-disable-next-line import/prefer-default-export
export function useTva(modelName = '') {
    const [modelState, setModelState] = useState(() => (modelName ? getState()[modelName] : getState()));

    useEffect(
        () => subscribe((allState) => {
            setModelState(modelName ? allState[modelName] : allState);
        }),
        [modelName],
    );

    return modelState;
}

export function connect(option) {
    return function CompModifer(Comp) {
        return function ConnectComp(props) {
            const store = useTva();
            const newProps = option.selector(store, props);
            return React.createElement(Comp, {
                ...props,
                ...newProps,
            });
        };
    };
}
