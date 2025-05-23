import React, { useContext } from 'react';

export const rootContext = React.createContext({});
const { Provider, Consumer } = rootContext;

export function usePageContext() {
    return useContext(rootContext);
}

export { Provider, Consumer };
