import React from 'react';
import { open } from './core';

import S from './index.module.scss';
import { Icon } from '../Icon';

let tipsModal = null;
let tipsTimeout = null;

const toStr = (s) => {
    if (typeof s == 'string') {
        return <div dangerouslySetInnerHTML={{ __html: s }} />;
    }

    if (React.isValidElement(s)) {
        return s;
    }

    return JSON.stringify(s);
};

/**
 * @param {string} title 提示内容
 * @param {number|{ time: number, type: 'fail' | 'success' | 'warn' }} time 停留时间
 */
function tips(title, time = 5000) {
    let option = { time: 3000 };
    if (time) {
        if (typeof time == 'number') {
            option.time = time;
        } else {
            option = Object.assign(option, time);
        }
    }

    const C = (
        <div className={S.tips}>
            {!!option.type && (
                <div className={S.icon}>
                    <Icon name={'tip-' + option.type} />
                </div>
            )}
            <div>{toStr(title)}</div>
        </div>
    );

    const callOpen = () => {
        tipsModal = open(C, {
            layer: false,
            animationType: 'ss',
            isStopBodyScroll: false,
            onClose() {
                clearTimeout(tipsTimeout);
                tipsModal = null;
            },
        });
    };
    const callClose = () => {
        tipsModal.close();
        tipsModal = null;
    };
    if (!tipsModal) {
        callOpen();
    } else if (option.type) {
        // 对于特殊类型的tip，先强制关闭，再打开一个新的
        callClose();
        callOpen();
    } else {
        clearTimeout(tipsTimeout);
        tipsModal.updateState(C);
    }

    if (option.time > 0) {
        tipsTimeout = setTimeout(callClose, option.time);
    }
    return tipsModal;
}

function warn(title) {
    return tips(title, { type: 'warn' });
}

function fail(title) {
    return tips(title, { type: 'fail' });
}

function success(title) {
    return tips(title, { type: 'success' });
}

/**
 * 需要手动关闭的提示
 * @param  {string} content [description]
 * @return {{ close: Function }}
 */
function longTips(content) {
    return tips(content, -1);
}

let loadingModal;
let loadingTimeout;
/**
 * 显示loading
 * @param {string} text
 * @param {{ time: number, type: string }} option
 */
function loading(text = '', option = {}) {
    loading.close();
    clearTimeout(loadingTimeout);

    loadingModal = open(
        <div className={S.loading}>
            <div className={S.loadingAnimation} />
            <div className={S.title}>{text}</div>
        </div>,
        {
            layer: false,
            animation: false,
            isStopBodyScroll: false,
            onClose() {
                loadingModal = null;
            },
        }
    );

    if (option.time > 0) {
        loadingTimeout = setTimeout(loading.close, option.time);
    } else {
        // loading最长显示10s
        loadingTimeout = setTimeout(loading.close, 10 * 1000);
    }

    return loadingModal;
}
loading.close = () => {
    loadingModal && loadingModal.close();
    loadingModal = null;
};

export {
    tips, // 提示
    warn,
    success,
    fail,
    longTips, // 长提示，需要手动关闭
    loading,
};
