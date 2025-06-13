import React from 'react';
import cx from '@/lemon-tools/cx';
import S from './index.module.scss';
import { pickOthers } from '@/lemon-tools/objectUtil';

/**
 * @param {{ type: 'success' | 'info' | 'warning' | 'error' } & React.AllHTMLAttributes} props
 * @returns
 */
export function Alert(props) {
    const { type } = props;
    const otherProps = pickOthers(props, ['className', 'type']);
    return (
        <div className={cx(S.alert, S[type], S.className)} {...otherProps}>
            {props.children}
        </div>
    );
}
