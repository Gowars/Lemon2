import React, { forwardRef } from 'react';
import RX from '@/lemon-tools/RX';

/**
 * @type {React.FC<React.AllHTMLAttributes & { throttle: number, disabled: boolean, comp: string  }>}
 */
const View = forwardRef(function ViewCore(props, ref) {
    const { comp: Comp = 'div', children, onClick, background, ...resetProps } = props;

    if (onClick) {
        const { throttle = 500, disabled } = resetProps;

        // click时间的一般处理方法
        resetProps.onClick = RX.throttle((e) => {
            if (disabled) return;

            // 如果返回的结果为Promise，则会切换到loading状态
            onClick && onClick(e);
            // eslint-disabled-next-line react/destructuring-assignment
        }, throttle);
    }

    if (background) {
        resetProps.style = resetProps.style || {};
        resetProps.style.backgroundImage = `url(${background})`;
    }

    return (
        <Comp {...resetProps} ref={ref}>
            {children}
        </Comp>
    );
});

export default View;
