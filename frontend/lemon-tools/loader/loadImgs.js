/**
 * 批量加载图片
 * @param {string[]} arr
 * @param {Function} callback
 * @param {number} maxTimeout 最大等待时间
 */
export function loadImgs(arr = [], callback, maxTimeout = 10 * 1000) {
    let isCall = false;
    const innerCall = () => {
        if (isCall) return;
        isCall = true;
        callback && callback();
    };
    Promise.all(
        arr.map((i) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = resolve;
                img.src = i;
            });
        })
    ).then(innerCall);
    setTimeout(innerCall, maxTimeout);
}
