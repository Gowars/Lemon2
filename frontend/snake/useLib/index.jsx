// 拖拽，复制上传
import { clone } from '@/lemon-tools/clone';
import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * 更好用的useState
 * @param {T} initState
 */
export function useBetterState(initState) {
    const ref = useRef({});
    const [cacheInitState] = useState(initState);
    const [state, updateStateCore] = useState(initState);
    ref.current = state;

    const setState = useCallback(function (obj) {
        const newState = Object.assign({}, ref.current, obj);
        updateStateCore(newState);
        ref.current = newState;
    }, [])

    return {
        stateRef: ref,
        state,
        setState,
        resetState() {
            setState(clone(cacheInitState))
        },
    };
}

export function useRefCallback(fn, depence = []) {
    const ref = useRef(fn);

    useEffect(() => {
        ref.current = fn;
    }, depence);
    return ref;
}

export function useDidMount(callback) {
    useEffect(() => {
        return callback();
    }, []);
}

export function useDidUpdate(callback, dependencyList) {
    const ref = useRef(0);
    useEffect(() => {
        ref.current += 1;
        if (ref.current > 1) {
            return callback();
        }
    }, dependencyList);
}
