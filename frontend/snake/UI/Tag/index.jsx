import React from 'react';
import cx from '@/lemon-tools/cx';
import S from './index.module.scss';

/**
 * @param {{ type: 'light'| 'success'| 'info'| 'warning'| 'danger' }} props
 * @returns
 */
export default function Tag(props) {
    const { type = 'light' } = props;
    return (
        <span className={cx(S.tag, S[type])}>
            {props.children}
        </span>
    );
}
