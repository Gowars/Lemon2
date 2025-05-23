// 图片压缩，文件类型转换 etc
export default function zip(file, fileSize = 1, fileType = 'image/jpeg') {
    // canvas toBlob polyfill
    if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value(callback, type = 'image/png', quality = 1) {
                const binStr = atob(this.toDataURL(type, quality).split(',')[1]);
                const len = binStr.length;
                const arr = new Uint8Array(len);

                for (let i = 0; i < len; i++) {
                    arr[i] = binStr.charCodeAt(i);
                }

                callback(
                    new Blob([arr], {
                        type,
                    })
                );
            },
        });
    }

    // 对于大于1.5M的图片做一个强制压缩
    const SIZE = file.size / 1024 / 1024;
    let quality = 1;

    if (SIZE >= fileSize) {
        quality = (fileSize / SIZE).toFixed(1);
    }

    return new Promise((resolve) => {
        // 对于非图片文件，直接上传
        if (SIZE < 1.5 || quality >= 1 || quality <= 0 || !/^image\/.+/.test(file.type)) {
            return resolve(file);
        }
        const canvas = document.createElement('canvas');

        // 获取到图片的宽高
        const url = window.URL.createObjectURL(file);

        const $img = document.createElement('img');

        $img.onload = function load() {
            const { width, height } = $img;
            canvas.width = width;
            canvas.height = height;

            const cxt = canvas.getContext('2d');
            cxt.drawImage($img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (Bob) => {
                    resolve(Bob);
                },
                fileType,
                quality
            );
        };

        // 加载错误，不是图片类型，直接返回原文件
        $img.onerror = function () {
            resolve(file);
        };
        $img.src = url;
    });
}
