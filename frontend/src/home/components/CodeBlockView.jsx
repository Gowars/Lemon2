import Prism from 'prismjs';
import 'prismjs/themes/prism.css'; // 引入默认样式
import 'prismjs/components/prism-json'; // 引入 Go 语言支持
import 'prismjs/components/prism-javascript'; // 引入 Go 语言支持
import 'prismjs/components/prism-bash'; // 引入 Go 语言支持
import React, { useRef, useEffect } from 'react';
import cx from '@/lemon-tools/cx';
import S from './../index.module.scss'
import { copyToClipboard } from '@/lemon-tools/copyToClipboard';
import { Modal } from '@/snake/main';
import { callGo } from '../core';

export function CodeBlockView({
    code,
    language = 'json',
    className = '',
    style = {},
    theme = '',
    url = '',
    ...otherProps
}) {
    const ref = useRef()
    useEffect(() => {
        // Prism.highlightElement(ref.current);
        Prism.highlightAll()
    }, [code])

    const handleCopy = (event) => {
        event.stopPropagation()
        copyToClipboard(otherProps.realCode || code)
        Modal.success('Copy Success 🍻')
    }

    return <div className={cx(S.codeBox, theme ? S[theme] : S.themeAuto, 'flex1', className)} style={style}>
        <div className={S.tools}>
            {!!url && <div onClick={() => callGo('open-url', url)} className={S.copy}>
                <img src="/icons/safari.png" alt="" className='w14 h14' />
            </div>}
            <div onClick={handleCopy} className={S.copy}>
                <img src="/icons/copy.png" alt="" className='w14 h14' />
            </div>
        </div>
        <pre ref={ref} style={{ margin: 0 }}>
            <code className={`language-${language}`}>{code}</code>
        </pre>
    </div>
}
