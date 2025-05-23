import React from 'react';
import S from './index.module.scss';

/**
 * @param {{ color: string }} props
 * @returns
 */
export function Loading({ color = 'red' }) {
    return <svg viewBox="25 25 50 50" className={S.circular}>
        <circle
            cx="50"
            cy="50"
            r="20"
            stroke={color}
            fill="none"
            className={S.path}
        />
    </svg>
}
