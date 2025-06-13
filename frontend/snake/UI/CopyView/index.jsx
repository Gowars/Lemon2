import React, { useRef } from 'react';
import { copyToClipboard } from '@/lemon-tools/copyToClipboard';
import { success } from '../Modal';

/**
 * 复制View
 * @param {{ value: string, tips?: string}} props
 * @returns
 */
export function CopyView(props) {
    const ref = useRef();
    const handleCopy = () => {
        const content = props.value || ref.current?.textContent;
        if (content) {
            success(props.tips || 'success');
            copyToClipboard(content);
        }
    };
    return (
        <div onClick={handleCopy} ref={ref}>
            {props.children || props.value}
        </div>
    );
}
