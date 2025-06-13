import React, { useRef, useEffect, useMemo } from 'react';

import QRCode from './qrcode.min';
import S from './index.module.scss';

const error = (content = '', $root) => {
    $root.innerHTML = `
        <div class="${S.qrError}">
            ${content}
        <div>
    `;
};

export function Qrcode({ url = '', width = 200 }) {
    const ref = useRef();
    const ele = useMemo(() => {
        // 创建一个input
        const $root = document.createElement('div')
        $root.style.cssText = `width: ${width}px; height: ${width}px;`
        try {
            new QRCode($root, {
                text: decodeURIComponent(url),
                width,
                height: width,
                colorDark: 'rgb(30, 30, 30)',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L,
            });
        } catch (err) {
            error(`链接太长，无法生成二维码 ${err.message}`, $root);
        }
        return $root
    }, [url, width])

    useEffect(() => {
        ref.current.appendChild(ele)
        return () => ele.remove()
    }, [ele])

    return <div ref={ref} className={S.qrcode} style={{ width }} />
}
