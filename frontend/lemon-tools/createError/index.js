/**
 * 模拟被加载文件执行js代码片段
 * @param {string} content
 * @example
 * execScript(`new Promise(() => xxxxx())`)
 */
export function execScript(content) {
    const file = new Blob([content])
    const src = URL.createObjectURL(file)
    const script = document.createElement('script')
    script.src = src
    document.head.appendChild(script)
}
