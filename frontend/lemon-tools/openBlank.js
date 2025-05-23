// 在新窗口打开网页
export default function (href = '/') {
    const a = document.createElement('a');
    a.target = '_blank';
    a.href = href;
    a.click();
}
