import React, { useEffect, useRef } from 'react';
import S from './index.module.scss';
import { animationDispatch } from '@/lemon-tools/scroll';

// 通过两个相同的文本，进行交替滚动，以实现无缝衔接的左右滚动动画

class AnimationCtl {
    constructor(dom1, dom2, containerDom) {
        this.dom1 = dom1;
        this.dom2 = dom2;
        this.containerDom = containerDom;
        this.start({ dom: dom1, id: 1 }, { dom: dom2, id: 2 });
    }

    start(current, next) {
        const { dom, id } = current;
        if (this[`pending${id}`]) return;
        this[`stop${id}`] && this[`stop${id}`]();
        this[`pending${id}`] = true;

        const width = dom.clientWidth;
        const parentWidth = this.containerDom.clientWidth;

        this[`stop${id}`] = animationDispatch({
            getEnd: () => -width - parentWidth,
            getStart: () => 0,
            duration: width * 40,
            onChange: (v) => {
                dom.style.cssText += `;transform: translateX(${v}px);`;

                if (v < -Math.max(width, parentWidth) - 50) {
                    this.start(next, current);
                }
            },
            onEnd: () => {
                this[`pending${id}`] = false;
            },
        });
    }

    stop() {
        this.stop1 && this.stop1();
        this.stop2 && this.stop2();
    }
}

export function Broadcast({ content }) {
    const containerDom = useRef();
    const dom1 = useRef();
    const dom2 = useRef();
    useEffect(() => {
        const actl = new AnimationCtl(dom1.current, dom2.current, containerDom.current);
        return () => actl.stop();
    }, [content]);

    return (
        <div ref={containerDom} className={S.contianer}>
            <div ref={dom1}>{content}</div>
            <div ref={dom2}>{content}</div>
        </div>
    );
}
