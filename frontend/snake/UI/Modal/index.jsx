import React from 'react';
import { open, close, closeAll, MODAL_CLOSE_CLASS } from './core';

import { tips, warn, success, fail, loading, longTips } from './tips';

import './testPulllClose';

import CModal from './component';

import S from './index.module.scss';
import { openBottom } from './openBottom';
import { language } from '@/src/i18n';

/**
 * [topMessage 顶部消息提示]
 * @method topMessage
 * @param  {String}   [title=''] [description]
 * @return {[type]}              [description]
 */
function topMessage(title = '') {
    return open(<div>{title}</div>, { animationType: 'top-message' });
}

/**
 * [confirm description]
 * @method confirm
 * @param  {String} title  [description]
 * @param  {Function} submit [确认回调]
 * @param  {Function} cancel [取消回调]
 * @return {Transition}        [调用关闭弹窗]
 */
function confirm(title, submit, cancel) {
    const item = open(
        <div className={S.confirm}>
            <div className={S.title}>{title}</div>
            <div className={S.btns}>
                <button
                    className={MODAL_CLOSE_CLASS}
                    onClick={() => {
                        cancel && cancel();
                    }}
                >
                    {language.Cancel}
                </button>
                <button
                    className={MODAL_CLOSE_CLASS}
                    onClick={() => {
                        submit && submit();
                    }}
                >
                    {language.Sure}
                </button>
            </div>
        </div>,
        {
            animationType: 'bb',
            escClose: true,
            onEscClose: () => cancel && cancel(),
        }
    );
    return item;
}

// 确认
function alert(title, submit) {
    const item = open(
        <div className={S.alert}>
            <div className={S.title}>{title}</div>
            <div className={S.btns}>
                <button
                    className={MODAL_CLOSE_CLASS}
                    onClick={() => {
                        submit && submit();
                    }}
                    type="button"
                >
                    {language.Sure}
                </button>
            </div>
        </div>,
        {
            animationType: 'bb',
        }
    );
    return item;
}

// 底部提示
// [{title, callback}], cancel
function bottomModal(list = [], showCancel = true) {
    const modal = open(
        <div>
            {list.map((item, index) => {
                const { title, callback } = item;
                const handleClick = () => {
                    callback && callback();
                    modal.close();
                };
                return <li key={index} onClick={handleClick}>{` ${title} `}</li>;
            })}
            {showCancel && (
                <li
                    className="cancel"
                    onClick={() => {
                        modal.close();
                    }}
                >
                    {language.Cancel}
                </li>
            )}
        </div>,
        {
            animationType: 'bottom-modal',
            layerClose: false,
        }
    );

    return modal;
}

/**
 * [closeDecorator 装饰器：用来在页面隐藏/关闭的时候，关闭所有弹窗]
 * @method closeDecorator
 * @param  {React Component}       target [description]
 */
function closeDecorator(target) {
    const { hide, componentWillUnmount } = target.prototype;

    target.prototype.hide = function () {
        hide && hide();
        closeAll();
    };

    target.prototype.componentWillUnmount = function () {
        componentWillUnmount && componentWillUnmount();
        closeAll();
    };
}

function log(info) {
    return longTips(JSON.stringify(info, null, 4));
}

function prepend(Child, options = {}) {
    // 非绝对定位
    return open(Child, {
        ...options,
        isStopBodyScroll: false,
        isStatic: true,
        prepend: true,
        animation: false,
    });
}

function append(Child, options = {}) {
    // 非绝对定位
    return open(Child, {
        ...options,
        isStopBodyScroll: false,
        isStatic: true,
        animation: false,
    });
}

export default {
    close, // 关闭指定弹窗
    closeAll, // 关闭所有弹窗
    open, // 打开一个弹窗
    prepend,
    append,
    tips, // 提示
    warn,
    success,
    fail,
    alert, // alert
    confirm,
    longTips, // 长提示，需要手动关闭
    bottomModal, // 底部Modal
    topMessage, // 顶部消息提示
    closeDecorator, // 装饰器：用来在页面隐藏/关闭的时候，关闭所有弹窗
    MODAL_CLOSE_CLASS,
    log,
    CModal,
    loading,
    openBottom,
};

export {
    close, // 关闭指定弹窗
    closeAll, // 关闭所有弹窗
    open, // 打开一个弹窗
    prepend,
    append,
    tips, // 提示
    warn,
    success,
    fail,
    alert, // alert
    confirm,
    longTips, // 长提示，需要手动关闭
    bottomModal, // 底部Modal
    topMessage, // 顶部消息提示
    closeDecorator, // 装饰器：用来在页面隐藏/关闭的时候，关闭所有弹窗
    MODAL_CLOSE_CLASS,
    log,
    CModal,
    loading,
    openBottom,
};
