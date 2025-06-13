import React, { useEffect, useRef } from 'react';
import cx from '@/lemon-tools/cx';
import observeNode from './observeNode';
import './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';

const defaultProps = {
    zIndex: 100,
    position: 'top',
    holderClassName: '',
    className: '',
};

/**
 * @param {defaultProps} props
 * @returns
 */
export default function Fixed(props) {
    const mixProps = getProps(props, defaultProps);
    const holderRef = useRef();
    const fixedRef = useRef();
    useEffect(() => {
        const updateHeight = () => {
            if (fixedRef.current) {
                const height = fixedRef.current.clientHeight;
                holderRef.current.style.cssText += `;height: ${height}px;`;
            }
        };
        updateHeight();
        return observeNode(fixedRef.current, updateHeight);
    }, [mixProps]);

    const { holderClassName, className } = mixProps;

    return (
        <div>
            <div
                className={cx(mixProps.position === 'bottom' ? 'fixedBottom' : 'fixedTop', className)}
                style={{
                    zIndex: mixProps.zIndex || 0,
                }}
                ref={fixedRef}
            >
                {mixProps.children}
            </div>
            <div ref={holderRef} className={holderClassName} />
        </div>
    );
}
