import React, { useEffect, useRef } from 'react';

import { createRoot } from 'react-dom/client';
import HotKey from '@/lemon-tools/hotkeys';

/**
 * @param {HTMLElement} dom
 * @param {string} eventName
 * @param {Function} fn
 * @returns
 */
function addEvents(dom, eventName, fn, delay) {
    let timer;
    if (delay > 0) {
        timer = setTimeout(() => {
            dom.addEventListener(eventName, fn);
        }, delay);
    } else {
        dom.addEventListener(eventName, fn);
    }
    return () => {
        clearTimeout(timer);
        dom.removeEventListener(eventName, fn);
    };
}

function RightMenus(props) {
    const rootRef = useRef();
    useEffect(() => {
        return new HotKey().on('esc', () => {
            props.close();
        }).unmount;
    }, []);

    useEffect(() => {
        return addEvents(
            document.documentElement,
            'click',
            (e) => {
                if (!rootRef.current.contains(e.target)) {
                    props.close();
                }
            },
            10
        );
    }, []);

    const Child = props.content;
    // 如果组件
    return (
        <div ref={rootRef}>
            <Child close={props.close} />
        </div>
    );
}

export class RenderPopup {
    constructor(option) {
        this.option = option;
        this.isClose = false;
        this.render();
    }

    close = () => {
        if (this.isClose) return;
        this.isClose = true;
        this.root.unmount();
        document.body.removeChild(this.rootDOM);
        this.option.onClose?.();
    };

    render() {
        // 支持animation
        this.rootDOM = document.createElement('div');
        document.body.appendChild(this.rootDOM);
        this.root = createRoot(this.rootDOM);
        this.root.render(<RightMenus close={this.close} content={this.option.content} pos={this.option.pos} />);
    }
}

export class RenderPopupV2 {
    constructor(option) {
        this.option = option;
        this.rootDOM = document.createElement('div');
        document.body.appendChild(this.rootDOM);
        this.rootDOM.style.cssText += `transition: all .3s;`;
    }

    close = () => {
        this.timer = setTimeout(() => {
            this.props?.onClose?.();
            this.reset();
            this.rootDOM.style.cssText += `left: unset; top: unset;`;
        }, 30);
    };

    reset() {
        clearTimeout(this.timer);
        if (!this.isRender) return;
        this.root?.unmount();
        this.isRender = false;
    }

    /**
     * @param {{ zIndex: number, pos: { left: number, right: number }, content: any }} props
     */
    render(props) {
        this.props?.onClose?.();
        this.reset();
        const { pos, content, zIndex = 500 } = props;
        this.props = props;
        // 支持animation
        this.rootDOM.style.cssText += `left: ${pos.left}px; top: ${pos.top}px; position: fixed; z-index: ${zIndex};`;
        this.root = createRoot(this.rootDOM);
        this.root.render(<RightMenus close={this.close} content={content} />);
        this.isRender = true;
    }
}

export const keepAliveModal = new RenderPopupV2();
