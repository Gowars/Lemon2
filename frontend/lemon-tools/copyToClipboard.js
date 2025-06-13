/**
 * [copyToClipboard 复制字符串到剪贴板 https://github.com/zenorocha/clipboard.js]
 * 注意这个操作必须是要用户行为触发，不然无法复制
 * @param  {String} [str=''] [需要复制的字符串]
 */
export function copyToClipboard(str = '') {
    if (navigator.clipboard?.writeText) {
        navigator.clipboard?.writeText(str);
        return;
    }

    const input = document.createElement('textarea');
    input.value = str;
    input.style.cssText = 'position: absolute; top: -10000px; left: -10000px;';
    document.body.appendChild(input);

    input.setAttribute('readonly', ''); // 避免ios弹出键盘
    input.select();
    input.setSelectionRange(0, input.value.length); // 选中文本
    document.execCommand('copy');
    document.body.removeChild(input);
}
