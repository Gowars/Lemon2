import { getProps } from '@/lemon-tools/getProps';
import React, { useEffect, useRef, useState } from 'react';

class Stage {
    constructor(callback, timeout) {
        this.callback = callback;
        this.timeout = timeout;
        this.timerArr = [];
        this.timer = undefined;
    }

    addTimeout(fn, time) {
        const num = setTimeout(() => {
            this.timerArr = this.timerArr.filter((i) => i !== num);
            fn();
        }, time);
        this.timerArr.push(num);
        return num;
    }

    unmount = () => {
        this.timerArr.forEach((i) => clearTimeout(i));
        this.timerArr = [];
    };

    setIn = (value) => {
        this.unmount();
        const exec = (a, b, c) => {
            this.callback(a);
            // 此处也可使用 requestIdleCallback 来触发
            // 目前24-11-18 safari还没有正式支持此api
            // 在使用了createProtal的情况下。因为react的批量更新特性，导致此处a/b被合并更新？
            const delay = 20;
            this.addTimeout(() => this.callback(b), delay);
            this.timer = this.addTimeout(() => this.callback(c), this.timeout + delay);
        };
        if (value) {
            exec(1, 2, 3);
        } else {
            exec(4, 5, 6);
        }
    };
}

const defaultProps = {
    /** 动画切换，true执行进入动画，false执行离开动画 */
    in: false,
    /** 动画执行时间 */
    timeout: 0,
    /** 动画className */
    classNames: '',
};

/**
 * @param {defaultProps} p
 * @returns
 */
export function CSSTransition(p) {
    const props = getProps(p, defaultProps);
    const { in: isShow, timeout, classNames } = props;
    const [stage, setStage] = useState(isShow ? 3 : 6);

    const classStage = {
        1: '-enter',
        2: '-enter-active',
        3: '',
        4: '-exit',
        5: '-exit-active',
        6: '',
    };
    const propsRef = useRef(props);
    propsRef.current = props;
    const stageM = useRef(null);

    useEffect(() => {
        stageM.current = new Stage((v) => {
            setStage(v);
            if (v == 6) {
                propsRef.current.onLeave?.();
            } else if (v == 3) {
                propsRef.current.onEnter?.();
            }
        }, timeout);
    }, []);

    const startRef = useRef(false);

    useEffect(() => {
        if (startRef.current) {
            stageM.current.setIn(isShow);
        }
        return () => {
            startRef.current = true;
        };
    }, [isShow]);

    const className = [props.children.props.className, classNames + classStage[stage]].filter((i) => i).join(' ');

    if (!isShow && stage == 6) {
        return null;
    }

    if (isShow && stage > 3) {
        return null;
    }

    return React.cloneElement(props.children, {
        className,
    });
}
