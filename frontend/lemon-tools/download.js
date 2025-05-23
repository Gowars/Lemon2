/**
 * 下载指定文件
 * @param {string} url
 * @param {string} name
 */
export default function download(url, name) {
    if (!url) return;
    if (/\.(svg|png|jpe?g|webp|gif)$/.test(url)) {
        downloadImg(url, name);
        return;
    }

    const a = document.createElement('a');
    a.download = name;
    a.href = url;
    a.target = '_blank';
    a.click();
}

/**
 * 下载跨域图片
 * @param {string} url
 * @param {string} name
 */
export function downloadImg(url, name) {
    if (!url) return;
    /**
     * 下载跨域图片，跨域图片需要设置crossorigin
     * <img class="qrcode" crossorigin="anonymous" src="https://xxxx.cdn">
     * 图片服务需要响应: Access-Control-Allow-Origin: *
     * ios端表现：会弹出下载提示框，并把文件下载到 文件 -> 下载，不会在所有照片中显示
     *  建议提示用户截屏或者长按图片保存
     * Android端表现：待补充
     */
    const img = new Image();
    img.addEventListener('load', () => {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
        var url = canvas.toDataURL();
        var a = document.createElement('a');
        a.download = name;
        a.href = url;
        a.click();
    });
    img.crossOrigin = 'anonymous';
    img.src = url;
}
