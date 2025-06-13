import React, { useState } from 'react';
import cx from '@/lemon-tools/cx';
import S from './index.module.scss';
import { storage } from '@/lemon-tools/storage';

/**
 * 默认展示tips，并可以手动关闭，手动关闭后tips不再展示
 * @param {Tips.defaultProps} props
 * @returns
 */
export function Tips(props) {
    const { storageKey } = props;

    const [showByStorage, setState] = useState(() => {
        // 通过storage来判断是否已经展示过
        if (storageKey) {
            return storage.getItem(`tipsKey-${storageKey}`);
        }
        return false;
    });

    const handleClose = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (storageKey) {
            storage.setItem(`tipsKey-${storageKey}`, 1);
            setState(1);
        }
        props.onClose();
    };

    const { show, onClick } = props;

    if (!show || showByStorage) {
        return null;
    }

    return (
        <div className={cx(S.tips, props.className, S[props.position])} style={props.style} onClick={onClick}>
            <div className={S.content}>{props.children}</div>
            {props.closable && <span onClick={handleClose}>x</span>}
        </div>
    );
}

Tips.defaultProps = {
    /** 指定存储key，以确保手动关闭后不再展示 */
    storageKey: '',
    /** tips是否展示 */
    show: true,
    /** tips被点击回调 */
    onClick: () => {},
    /** tips关闭回调 */
    onClose: () => {},
    /** tips箭头所处位置 */
    position: 'bottom',
    style: {},
    className: '',
    /** tips是否可以被关闭 */
    closable: true,
};
