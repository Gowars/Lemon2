import React, { useEffect, useRef, useCallback } from 'react';
import Touch from '../../core';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    /** 禁用 */
    disabled: false,
    /** 限制移动方向 x|y */
    limit: '',
};

/**
 *
 * @param {defaultProps} props
 * @returns
 */
export default function Moveable(props) {
    const { disabled, limit } = getProps(props, defaultProps);

    const rootRef = useRef();

    const position = useRef({ x: 0, y: 0 });
    const setP = useCallback(
        (change, record = false) => {
            const { current: $root } = rootRef;
            if (!$root) return;

            const X = limit == 'x' ? 0 : position.current.x + change.x;
            const Y = limit == 'y' ? 0 : position.current.y + change.y;
            $root.style.cssText += `;
            transform: translate3d(${X}px, ${Y}px, 0);
        `;

            if (record) {
                position.current = {
                    x: X,
                    y: Y,
                };
            }
        },
        [limit]
    );

    useEffect(() => {
        if (disabled) {
            return;
        }

        const { current: $root } = rootRef;

        // 做一些事情
        const touch = new Touch($root, {
            preventDefault: false,
            iosSystemSwipe: false,
            listenerOptions: {
                capture: true,
            },
        })
            .on('changev2', ({ state, event }) => {
                const { change } = state;
                event.preventDefault();
                event.stopPropagation();
                setP(change);
            })
            .on('endv2', ({ done, state, event }) => {
                const { change } = state;
                if (state.isMove) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                done();
                setP(change, true);
            });

        return () => {
            touch.destroy();
        };
    }, [disabled, limit]);

    return <div ref={rootRef}>{props.children}</div>;
}
