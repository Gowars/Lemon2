import React, { useRef, useState } from 'react';
import { Input } from '../Input';

import S from './index.module.scss';
import cx from '@/lemon-tools/cx';
import { getProps } from '@/lemon-tools/getProps';
import { Form } from '../Form';

const defaultProps = {
    placeholder: '',
    onSubmit: () => {},
    className: '',
    defaultValue: '',
};

/**
 * @param {defaultProps} props
 */
export function SearchView(props) {
    const mixProps = getProps(props, defaultProps);
    const inputRef = useRef();
    const [state, setState] = useState({ search: mixProps.defaultValue });

    const submit = () => {
        mixProps.onSubmit(state.search);
    };

    return (
        <div className={cx(S.search, mixProps.className)}>
            <Form noRoot value={state} onChange={setState}>
                <Input
                    name="search"
                    placeholder={mixProps.placeholder}
                    onKeyDown={(e) => e.keyCode == 13 && submit()}
                    ref={inputRef}
                />
                <span
                    className={cx(S.clear, !state.search && S.hide)}
                    onClick={() => {
                        inputRef.current.handleInput?.('');
                    }}
                />
                <div className={S.btn} onClick={submit}>
                    搜索
                </div>
            </Form>
        </div>
    );
}
