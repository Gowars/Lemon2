import React, { createRef, useState } from 'react';
import { DatePicker } from './core';

import S from './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';

export { DatePicker };

const defaultProps = {
    /** 是否渲染组件 */
    show: false,
    /** 数据变化回调 */
    onChange: () => 0,
    /** 数据变化回调 */
    value: Date.now(),
    children: null,
    /** 'left', 'right', 'center' */
    position: 'left',
    /** 不显示底部按钮栏 */
    disableFooter: false,
    /** 默认为时间区间选择模式 */
    mode: 'range',
};

/**
 * 时间选择器
 * @export
 * @param {defaultProps} props
 * @returns
 */
export function DatePickerWrap(props) {
    const mixProps = getProps(props, defaultProps);
    const [isShow, setShow] = useState(mixProps.show);
    const { value, title } = mixProps;
    const refRoot = createRef();

    const handleClick = (e) => {
        e.stopPropagation();
        setShow(true);
    };

    return (
        <div className={[S.datepicker, 'other-touch-action'].join(' ')} onClick={handleClick} ref={refRoot}>
            {mixProps.children}
            {isShow && (
                <div className={[S.datepkReal, S[mixProps.position]].join(' ')}>
                    <DatePicker
                        value={value}
                        title={title}
                        root={refRoot}
                        onChange={(...args) => {
                            setShow(false);
                            mixProps.onChange(...args);
                        }}
                        mode={mixProps.mode}
                        onCancel={() => setShow(false)}
                        disableFooter={mixProps.disableFooter}
                    />
                </div>
            )}
        </div>
    );
}
