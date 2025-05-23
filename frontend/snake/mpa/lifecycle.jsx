import React, { useEffect, useRef } from 'react';
import { Consumer, usePageContext } from './context';

// 为组件添加onPageShow/onPageHide生命周期
export default function LifecycleComponent(target) {
    return class extends target {
        componentDidMount() {
            super.componentDidMount && super.componentDidMount();
            this._context.pageLifecycle?.push(this);
        }

        componentWillUnmount() {
            super.componentWillUnmount && super.componentWillUnmount();
            this._context.pageLifecycle?.remove(this);
        }

        render() {
            return (
                <>
                    <Consumer>
                        {(context) => {
                            this._context = context;
                        }}
                    </Consumer>
                    {super.render()}
                </>
            );
        }
    };
}

/**
 * 通过组合的方式扩展class组件的生命周期
 * @export
 * @param {{ instance: React.Component, children: any }} { instance, children }
 * @returns
 */
export function pageLifecycleInvoker({ instance, children }) {
    const { $dom } = usePageContext();
    useEffect(() => {
        $dom.pageLifecycle.push(instance);
        return () => {
            $dom.pageLifecycle.remove(instance);
        };
    }, [$dom, instance]);

    return children || null;
}

export function useLifecycle(option) {
    const { $dom } = usePageContext();
    useEffect(() => {
        $dom.pageLifecycle.push(option);
        return () => {
            $dom.pageLifecycle.remove(option);
        };
    }, [option]);
}

export function usePageActiveEffect(callback) {
    const { $dom } = usePageContext();
    const callbackRef = useRef();
    callbackRef.current = callback;

    useEffect(() => {
        let prevResult;
        let isActive = false;
        return $dom.pageLifecycle.watch((status) => {
            if (status == 'onPageAppear' && !isActive) {
                isActive = true;
                prevResult = callbackRef.current();
            }

            if (status == 'onPageHide' && isActive) {
                prevResult && prevResult();
                isActive = false;
            }
        });
    }, []);
}
