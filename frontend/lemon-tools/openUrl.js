/**
 * 在新标签页打开链接
 * @param {string} url
 */
export function openUrl(url) {
    const a = document.createElement('a');
    a.target = '_blank';
    a.referrerPolicy = ' no-referrer';
    a.href = url;
    a.click();
}
