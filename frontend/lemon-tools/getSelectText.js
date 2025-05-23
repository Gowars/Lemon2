/**
 * 获取当前页面选中文本
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection/getRangeAt
 * https://developer.mozilla.org/en-US/docs/Web/API/Range
 * @returns
 */
function getSelectText() {
    const ranges = [];
    const sel = window.getSelection();

    for (let i = 0; i < sel.rangeCount; i++) {
        const r = sel.getRangeAt(i);
        ranges[i] = r;
    }
    return ranges.map((i) => i.toString()).join('\n');
}

// 强制复制选中文本
// copy(getSelectText())

export { getSelectText };
