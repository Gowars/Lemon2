function position(dom) {
    const rect = dom.getBoundingClientRect();
    const { top, bottom, left, right, height, width } = rect;

    return {
        top,
        bottom,
        left,
        right,
        height,
        width,
    };
}

/**
 * 获取相对父元素的位置信息
 * @param {HTMLElement} dom
 */
export function getOffset(dom) {
    // offsetTop表示元素与其父元素的距离
    const { bottom, right, top, left, height, width } = position(dom);
    const { bottom: pBottom, right: pRight, top: pTop, left: pLeft } = position(dom.parentElement);
    return {
        top: top - pTop,
        left: left - pLeft,
        bottom: pBottom - bottom,
        right: pRight - right,
        height,
        width,
    };
}
