/**
 * 拖拽应该监听的是body，然后在ele上进行响应，移动的是另外一个玩意儿
 * 拖拽缩放，返回相对位置 x,y,h,w
 */
import Touch from '../core';
import util from '../util';

export default class Move {
    enable = true;

    constructor(ele) {
        this.ele = ele;
        let origin = {};
        let isCorner = false;
        let scaleX = 0;
        let scaleY = 0;
        let match = false;
        this.touch = new Touch(document.body, {
            preventDefault: false,
        })
            .on('startv2', ({ event }) => {
                match = false;
                if (util.getParent(event.target, ele)) {
                    match = true;
                    const { clientX, clientY } = event.touches ? event.touches[0] : event;
                    const { height, width, top, left } = util.getOrigin(ele);
                    const W = 30;
                    const { top: y, left: x } = util.position(ele);

                    origin = {
                        x,
                        y,
                        h: height,
                        w: width,
                    };
                    const [offsetX, offsetY] = [clientX - left, clientY - top];

                    ele.style.cssText += '; transform-origin: none; transform: none;';
                    if (offsetX < W) {
                        if (offsetY < W) {
                            // 左上
                            isCorner = 'lt';
                            ele.style.cssText += ';cursor: se-resize; transform-origin: right bottom;';
                        } else if (height - offsetY < W) {
                            // 左下
                            isCorner = 'lb';
                            ele.style.cssText += ';cursor: ne-resize; transform-origin: right top;';
                        }
                    } else if (width - offsetX < W) {
                        if (offsetY < W) {
                            // 右上
                            isCorner = 'rt';
                            ele.style.cssText += ';cursor: sw-resize; transform-origin: left bottom;';
                        } else if (height - offsetY < W) {
                            // 右下
                            isCorner = 'rb';
                            ele.style.cssText += ';cursor: nw-resize; transform-origin: left top;';
                        }
                    }
                }
            })
            .on('nativeChange', (event) => {
                if (!match) return;
                event.preventDefault();
            })
            .on('changev2', ({ state }) => {
                const { change } = state;
                if (!match) return;
                if (isCorner) {
                    switch (isCorner) {
                        case 'lt': {
                            scaleX = -change.x / origin.w;
                            scaleY = -change.y / origin.h;
                            break;
                        }
                        case 'lb': {
                            scaleX = -change.x / origin.w;
                            scaleY = change.y / origin.h;
                            break;
                        }
                        case 'rt': {
                            scaleX = change.x / origin.w;
                            scaleY = -change.y / origin.h;
                            break;
                        }
                        default: {
                            scaleX = change.x / origin.w;
                            scaleY = change.y / origin.h;
                        }
                    }
                    // ele.style.cssText += `; transform: scale3d(${1 + scaleX}, ${1 + scaleY}, 1);`

                    let lt = { x: 0, y: 0 };
                    switch (isCorner) {
                        case 'lt': {
                            lt = change;
                            break;
                        }
                        case 'lb': {
                            lt.x = change.x;
                            break;
                        }
                        case 'rt': {
                            lt.y = change.y;
                            break;
                        }
                        default:
                    }
                    ele.style.cssText += `;
                        width: ${origin.w * (1 + scaleX)}px;
                        height: ${origin.h * (1 + scaleY)}px;
                        left: ${lt.x + origin.x}px;
                        top: ${lt.y + origin.y}px;
                        transform: none;
                    `;
                } else {
                    ele.style.cssText += `; transform: translate3d(${change.x}px, ${change.y}px, 0);`;
                }
            })
            .on('endv2', ({ done, state }) => {
                const { change } = state;
                if (!match) {
                    return;
                }
                match = false;
                if (isCorner) {
                    let lt = { x: 0, y: 0 };
                    switch (isCorner) {
                        case 'lt': {
                            lt = change;
                            break;
                        }
                        case 'lb': {
                            lt.x = change.x;
                            break;
                        }
                        case 'rt': {
                            lt.y = change.y;
                            break;
                        }
                        default:
                    }
                    ele.style.cssText += `;
                        width: ${origin.w * (1 + scaleX)}px;
                        height: ${origin.h * (1 + scaleY)}px;
                        left: ${lt.x + origin.x}px;
                        top: ${lt.y + origin.y}px;
                        transform: none;
                    `;
                } else {
                    ele.style.cssText += `;cursor: auto; left: ${change.x + origin.x}px; top: ${
                        change.y + origin.y
                    }px; transform: none;`;
                }
                isCorner = false;
                done();
            });
    }

    get state() {
        const { height: h, width: w } = util.getOrigin(event.currentTarget);
        const { top: y, left: x } = util.position(event.currentTarget);
        return {
            x,
            y,
            w,
            h,
        };
    }

    enable() {
        if (this.enable) return;
        this.enable = true;
        this.touch.enable();
    }

    disable() {
        this.touch.disable();
    }
}
