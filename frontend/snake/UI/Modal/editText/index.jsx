import React, { useEffect } from 'react';

import { Modal } from '@/snake/main';

import { useBetterState } from '@/snake/useLib';
import Button from '../../Button';
import { Textarea } from '../../Form';

import S from './index.module.scss';
import HotKey from '@/lemon-tools/hotkeys';
import { uuid } from '@/lemon-tools/uuid';
import os from '@/lemon-tools/os';

export const editText = ({ onSave, title, value = '' }) => {
    const id = 'modal-content' + uuid(8);
    const handleSubmit = () => {
        onSave(document.querySelector(`#${id} textarea`).value);
        modal.close();
    };

    const EditView = () => {
        const { state, setState } = useBetterState({ content: value || '' });

        useEffect(() => {
            return new HotKey().on('esc', () => {
                modal.close();
            }).unmount;
        }, []);

        return (
            <div id={id} className={S.modal}>
                <div className={S.titleRow}>
                    <Button className="modal-close" theme="cancel">
                        Cancel
                    </Button>
                    <p className={S.title}>{title}</p>
                    <Button onClick={handleSubmit}>Save</Button>
                </div>
                <Textarea
                    value={state.content}
                    onChange={(content) => {
                        setState({ content });
                    }}
                />
            </div>
        );
    };

    const modal = Modal.open(<EditView />, {
        position: os.pc ? 'center' : 'bottom',
        animationType: os.pc ? 'ss' : 'dd',
    });
};
