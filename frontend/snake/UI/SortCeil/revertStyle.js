/**
 * 再操作完dom后恢复其原有样式
 * @param {HTMLElement} dom
 * @param {Array<string>} keys
 * @returns
 */
export function revertStyle(dom, keys = []) {
    const before = keys.map((key) => {
        return { key, value: dom.style.getPropertyValue(key) };
    });
    return () => {
        before.forEach((i) => {
            if (!i.value) {
                dom.style.removeProperty(i.key);
            } else {
                dom.style.setProperty(i.key, i.value);
            }
        });
    };
}
