/**
 * @param {HTMLElement} dom
 * @returns
 */
function getRect(dom) {
    const rect = dom.getBoundingClientRect();
    return {
        left: dom === document.documentElement ? 0 : rect.left,
        top: dom === document.documentElement ? 0 : rect.top,
        width: rect.width,
        height: rect.height,
    };
}

/**
 * @param {HTMLElement} scrollDom 可滚动元素
 * @param {HTMLElement} child 子元素
 * @param {{ offset: number, modifyScrollRect: Function }} option offset:有的时候我们不想元素刚好贴边展示, modifyScrollRect: 因为fixed元素的遮挡，需要矫正rect
 */
function makeChildShow(scrollDom = document.documentElement, child = document.body, option = {}) {
    const childRect = getRect(child);
    let scrollRect = getRect(scrollDom);
    scrollRect = option.modifyScrollRect?.(scrollRect) || scrollRect;

    const getV = (lr = 'left') => {
        const wh = lr == 'left' ? 'width' : 'height';
        const whUpper = wh.replace(/^./, (a) => a.toUpperCase());
        const lrUpper = lr.replace(/^./, (a) => a.toUpperCase());
        // 如果元素刚好在父元素的可视区域，就不移动
        let v = 0;
        // 在父元素的左边（上边）
        if (childRect[lr] < scrollRect[lr]) {
            v = childRect[lr] - scrollRect[lr];
        } else if (childRect[lr] + childRect[wh] > scrollRect[lr] + scrollRect[wh]) {
            // 在父元素的右边（下边）
            v = childRect[lr] + childRect[wh] - (scrollRect[lr] + scrollRect[wh]);
        }

        if (v == 0) {
            return;
        }

        const oldV = scrollDom[`scroll${lrUpper}`];
        // 加上偏移量，偏移量和滚动方向挂钩
        v += (v / Math.abs(v)) * option.offset;

        let newV = v + scrollDom[`scroll${lrUpper}`];
        if (newV < option.offset && newV < oldV) {
            newV = 0;
        } else if (newV > scrollDom[`scroll${whUpper}`] - scrollRect[wh] - option.offset && newV > oldV) {
            newV = scrollDom[`scroll${whUpper}`] - scrollRect[wh];
        }
        return { [lr]: newV };
    };

    const to = {
        ...getV('left'),
        ...getV('top'),
    };

    if (Object.keys(to).length) {
        scrollDom.scrollTo(to);
    }
}

// makeChildShow(document.querySelector('.scroll-row'), $0, {
//     offset: 10,
//     modifyScrollRect: res => {
//         res.top += 44
//         res.height -= 44
//     }
// })

export { makeChildShow };
