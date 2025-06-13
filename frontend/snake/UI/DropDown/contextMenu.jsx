import React, { useRef, useState } from 'react';
import cx from '@/lemon-tools/cx';

import { keepAliveModal, RenderPopup } from './renderPopup';

import S from './contextMenu.module.scss';
import { getProps } from '@/lemon-tools/getProps';

export function SelectViewForContext({ list = [], value = '', onChange, minWidth, title }) {
    const [show, setShow] = useState(false);
    const rootRef = useRef(null);

    const handleCtxMenu = (e) => {
        e.preventDefault();
        setShow(true);

        const rect = rootRef.current.getBoundingClientRect();
        const pos = { left: rect.x + rect.width / 2, top: rect.y + rect.height };
        const menus = list.map((item) => {
            return {
                text: item.text,
                onClick: () => {
                    onChange(item.value);
                    pop.close();
                },
            };
        });

        const pop = new RenderPopup({
            onClose() {
                setShow(false);
            },
            content() {
                return (
                    <div className={S.context} style={pos}>
                        {menus.map((i) => {
                            return (
                                <div className={S.item} onClick={i.onClick} key={i.value}>
                                    {i.text}
                                </div>
                            );
                        })}
                    </div>
                );
            },
        });
    };

    return (
        <div className={cx(S.selector, show && S.active)} ref={rootRef}>
            <div className={S.input} onClick={handleCtxMenu} style={{ minWidth }}>
                {title || list.find((i) => i.value == value)?.text || '请选择'}
            </div>
        </div>
    );
}

const defaultProps = {
    list: [],
    value: '',
    onChange: () => 0,
    minWidth: '',
    title: '',
    className: '',
    render: () => null,
};

/**
 *
 * @param {defaultProps} props
 * @returns
 */
export function SelectViewForContextV2(props) {
    const mixProps = getProps(props, defaultProps);
    const [show, setShow] = useState(false);
    const rootRef = useRef(null);
    const { list, value, title, minWidth } = mixProps;

    const handleCtxMenu = (e) => {
        e.preventDefault();
        setShow(true);

        const rect = rootRef.current.getBoundingClientRect();
        const menus = mixProps.list.map((item) => {
            return {
                ...item,
                text: item.text,
                value: item.value,
                onClick: () => {
                    mixProps.onChange(item.value);
                    keepAliveModal.close();
                },
            };
        });

        keepAliveModal.render({
            pos: { left: rect.x + rect.width / 2, top: rect.y + rect.height },
            onClose() {
                setShow(false);
            },
            content() {
                return (
                    <div className={S.context}>
                        {menus.map((i) => {
                            return (
                                <div className={S.item} onClick={i.onClick} key={i.value}>
                                    {mixProps.render(i) || i.text}
                                </div>
                            );
                        })}
                    </div>
                );
            },
        });
    };

    let titleView = title;
    if (!titleView) {
        const item = list.find((i) => i.value == value);
        titleView = mixProps.render(item) || item.text || '请选择';
    }

    return (
        <div className={cx(S.selector, show && S.active, mixProps.className)} ref={rootRef}>
            <div className={S.input} onClick={handleCtxMenu} onContextMenu={handleCtxMenu} style={{ minWidth }}>
                {titleView}
            </div>
        </div>
    );
}
