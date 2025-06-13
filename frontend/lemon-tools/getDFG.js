import template from "../template";

/**
 * [getDFG 字符串 -> DocumentFragment]
 * 因为每一次直接插入document中都会引起页面重新渲染，不如一次来的节省性能能
 * @param  {String} [str='']
 * @return {DocumentFragment}
 */
export default function getDFG(str = '') {
    const d = document.createElement('div');
    d.innerHTML = str;
    const df = document.createDocumentFragment();
    Array.from(d.childNodes || []).forEach((i) => df.appendChild(i));
    return df;
}


// 渲染
export function render(...args) {
    return getDFG(template(...args));
}

// 添加
export function append($dom, ...nodes) {
    nodes.forEach((i) => $dom.appendChild(i));
}
