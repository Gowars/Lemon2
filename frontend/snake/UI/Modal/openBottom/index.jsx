import React from 'react';
import { open } from '../core';
import S from './index.module.scss';
import cx from '@/lemon-tools/cx';
import { Icon } from '../../Icon';

/**
 *
 * @param {{ title: string, content: any, theme: string }} option
 * @returns
 */
export function openBottom(option) {
    return open(
        <div className={cx(S.ios, S[option.theme])}>
            <div className={S.title}>{option.title}</div>
            <div className={cx(S.close, 'modal-close')}>
                <Icon name="close" />
            </div>
            {option.content}
        </div>,
        {
            position: 'bottom',
            animationType: 'dd',
        }
    );
}
