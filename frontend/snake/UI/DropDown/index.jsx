import React, { useEffect, useRef, useState } from 'react';

import S from './index.module.scss';
import cx from '@/lemon-tools/cx';
import HotKey from '@/lemon-tools/hotkeys';

export function SelectView({ list = [], value = '', onChange, minWidth, title }) {
    const [show, setShow] = useState(false);
    const rootRef = useRef(null);
    const handleClick = (item) => () => {
        setShow(!show);
        onChange(item.value);
    };

    useEffect(() => {
        const hk = new HotKey().on('esc', () => {
            setShow(false);
        });

        const handler = (e) => {
            if (rootRef.current.contains(e.target)) {
                return;
            } else {
                setShow(false);
            }
        };
        window.addEventListener('click', handler);

        return () => {
            hk.unmount();
            window.removeEventListener('click', handler);
        };
    }, []);

    return (
        <div className={cx(S.selector, show && S.active)} ref={rootRef}>
            <div className={S.input} onClick={() => setShow(!show)} style={{ minWidth }}>
                {title || list.find((i) => i.value == value)?.name || '请选择'}
            </div>
            <div className={S.arrow} style={{ minWidth }}>
                <div className={cx(S.box)} style={{ height: list.length * 40 }}>
                    {list.map((i) => (
                        <div
                            className={cx(S.item, value == i.value && S.active)}
                            onClick={handleClick(i)}
                            key={i.value}
                        >
                            {i.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
