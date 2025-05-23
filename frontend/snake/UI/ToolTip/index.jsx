import React, { useState } from 'react';
import cx from '@/lemon-tools/cx';
import S from './index.module.scss';
import { getProps } from '@/lemon-tools/getProps';
import { CSSTransition } from '@/snake/UI/CSSTransition';

const defaultProps = {
    show: false,
    zIndex: 100,
    tip: '',
    /** 支持top、topLeft、bottom、bottomLeft */
    position: 'top',
    flex: false,
    padding: '10px',
    /** 延迟消失，避免抖动 */
    delay: 0,
};

class Timer {
    buffer = [];
    add(fn, time) {
        this.buffer.forEach((i) => clearInterval(i));
        this.buffer = [];
        if (time > 0) {
            const v = setTimeout(fn, time);
            this.buffer.push(v);
        } else {
            fn();
        }
    }
}

/**
 * 悬停后tips展示文案提示
 * @export
 * @param {defaultProps} props
 * @returns {React.FC}
 */
export default function ToolTip(props) {
    const mixProps = getProps(props, defaultProps);
    const [isShow, setIsShow] = useState(mixProps.show);

    const [timer] = useState(() => new Timer());

    const handleMouseEnter = () => {
        timer.add(() => setIsShow(true));
    };

    const handleMouseLeave = () => {
        timer.add(() => setIsShow(false), mixProps.delay);
    };

    return (
        <div
            className={cx(S['ui-tooltip'], mixProps.className, mixProps.flex && S.flex)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <CSSTransition in={isShow} classNames="ui-tip-animation" timeout={300}>
                <div
                    className={cx(S.tips, S[mixProps.position], 'disable-sort-ceil')}
                    style={{ zIndex: mixProps.zIndex, padding: mixProps.padding }}
                >
                    {mixProps.tip}
                </div>
            </CSSTransition>
            {mixProps.children}
        </div>
    );
}
