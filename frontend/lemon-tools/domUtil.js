/**
 * @param {HTMLElement} d
 * @param {(e: HTMLElement) => boolean} check
 * @returns
 */
export function findParent(d, check) {
    while (d) {
        if (check(d)) {
            return d;
        }
        d = d.parentElement;
    }
    return null;
}

/**
 * @param {HTMLElement} parent
 * @param {HTMLElement} child
 */
export function scrollIntoCenter(parent, child) {
    const parentRect = parent.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    const top = childRect.top - parentRect.top - (parentRect.height - childRect.height) / 2;
    parent.scrollTop += top;
}

/**
 * 遍历每一个子Node
 * 当callback返回2时，不遍历其子元素
 * * 当callback返回3时，中断剩余遍历
 * @param {HTMLElement} dom
 * @param {(i: Node) => number | void} callback
 * @returns {number}
 */
export function findChild(dom = document.documentElement, callback) {
    const res = callback(dom);
    if ([2, 3].includes(res)) {
        return res;
    }
    const array = dom.childNodes;
    if (array?.length) {
        for (let index = 0; index < array?.length; index++) {
            const fRes = findChild(array[index], callback);
            if (fRes == 3) {
                return fRes;
            }
        }
    }
    return 0;
}

/**
 * 遍历每一个子Node
 * 当callback返回2时，不遍历其子元素
 * * 当callback返回3时，中断剩余遍历
 * @param {HTMLElement} dom
 * @param {(i: Node) => number | void} callback
 * @returns {number}
 */
export function findChildForShadowDOM(dom = document.documentElement, callback) {
    const res = callback(dom);
    if ([2, 3].includes(res)) {
        return res;
    }
    const array = dom.childNodes;
    if (array?.length) {
        for (let index = 0; index < array?.length; index++) {
            const ele = array[index];
            const fRes = findChild(ele, callback);
            if (fRes == 3) {
                return fRes;
            }
            // 如果shadow dom是open状态
            // 穿透shadow dom
            if (ele.shadowRoot) {
                const sRes = findChild(ele.shadowRoot, callback);
                if (sRes == 3) {
                    return sRes;
                }
            }
        }
    }
    return 0;
}

// const arr = []
// findChild(document.querySelector('.main_page_dns_servers'), (node) => {
//     if (node.classList?.contains('name')) {
//         return 2
//     }
//     if (node.nodeType == 3 && /(\d+\.){3}\d+/.test(node.data)) {
//         console.log(node)
//         arr.push(node.data)
//     }
// })
// Array.from(new Set(arr))
