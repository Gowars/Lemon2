import React from 'react';
import PullToClose from '../../Touch/Example/PullToClose';
import { open } from '../index';

export function openBottom(content, option) {
    const modal = open(
        <PullToClose onClose={() => modal.close()} target=".scroller">
            <div style={{ background: '#fff', height: '50vh', overflowY: 'scroll' }} className="scroller">
                {content}
                <div style={{ height: '80vh' }} />
            </div>
        </PullToClose>,
        {
            animationType: 'dd',
            position: 'bottom',
            ...option,
        }
    );
    return modal;
}
