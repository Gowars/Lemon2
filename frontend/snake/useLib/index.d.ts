interface IBetterStateResult<T> {
    state: T;
    setState: <X extends T>(state: X) => void;
    stateRef: {
        current: T
    };
    resetState: () => void;
}

export function useBetterState<T>(state: T): IBetterStateResult<T>

export function useRefCallback(fn: Function, dependencyList: Array<any>)

export function useDidUpdate(fn: Function, dependencyList: Array<any>)
