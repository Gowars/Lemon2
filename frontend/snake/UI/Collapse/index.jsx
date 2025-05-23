import React, { useRef, useState } from 'react';
import S from './index.module.scss';
import { useBetterState, useDidUpdate } from '@/snake/useLib';
import cx from '@/lemon-tools/cx';

export function Collapse({ value = false, title = '', children, onChange }) {
    const [innerValue, setInnerV] = useState(value);
    const onClick = () => {
        if (onChange) {
            onChange(!value);
        } else {
            setInnerV(!innerValue);
        }
    };

    const showContent = onChange ? value : innerValue;

    return (
        <div className={S.collapse}>
            <div onClick={onClick} className={S.title}>
                {title}
            </div>
            <AnimateHeight value={showContent}>
                <div className={S.inner}>{children}</div>
            </AnimateHeight>
        </div>
    );
}

function AnimateHeight(props) {
    const contentRef = useRef();
    const { state, setState } = useBetterState({
        style: null,
        className: props.value ? S.show : S.hide,
    });

    useDidUpdate(() => {
        let timer;

        if (props.value) {
            setState({
                style: {
                    height: contentRef.current.scrollHeight,
                },
                className: S.animate,
            });
        } else {
            setState({
                style: {
                    height: contentRef.current.scrollHeight,
                },
                className: '',
            });

            setTimeout(() => {
                setState({
                    style: {
                        height: 0,
                    },
                    className: S.animate,
                });
            });
        }

        timer = setTimeout(() => {
            setState({
                style: null,
                className: props.value ? S.show : S.hide,
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [props.value]);

    return (
        <div ref={contentRef} style={state.style} className={cx(S.animateWrap, state.className)}>
            {props.children}
        </div>
    );
}
