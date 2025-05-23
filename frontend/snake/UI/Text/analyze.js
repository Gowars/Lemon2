/**
 * 获取是否溢出等信息
 * @param {HTMLElement} dom
 * @param {string} [content='']
 * @returns
 */
export default function analyze(dom, content = '') {
    // 缓存当前dom下存在的所有节点，待计算结束后，进行恢复操作
    const cacheNodes = Array.from(dom.childNodes);
    let start = 0;
    let fakeEnd = content.length;

    while (start != fakeEnd) {
        // 通过二分法查找
        const end = Math.round((start + fakeEnd) / 2);

        dom.textContent = content.slice(0, end);

        const isOverflow = dom.scrollHeight > dom.clientHeight;
        // 间距为1，最终获取的结果还是有溢出，结束遍历
        if (isOverflow && fakeEnd - start === 1) {
            break;
        }

        if (isOverflow) {
            fakeEnd = end;
        } else {
            start = end;
        }
    }

    const result = {
        start,
        isOverflow: start !== content.length,
    };

    Array.from(dom.childNodes).forEach((i) => {
        i.remove()
    });
    cacheNodes.forEach((i) => dom.appendChild(i));

    return result;
}
