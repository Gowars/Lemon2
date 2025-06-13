if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
        value(callback, type, quality) {
            const binStr = atob(this.toDataURL(type, quality).split(',')[1]);
            const len = binStr.length;
            const arr = new Uint8Array(len);

            for (let i = 0; i < len; i++) {
                arr[i] = binStr.charCodeAt(i);
            }

            callback(
                new Blob([arr], {
                    type: type || 'image/png',
                })
            );
        },
    });
}

function toImg(file) {
    return new Promise((res) => {
        const img = new Image();
        img.onload = () => {
            res(img);
        };
        img.src = typeof file === 'string' ? file : URL.createObjectURL(file);
    });
}

function urlToFile(url) {
    // 跨域图片对于canvas来说无法toDataURL，除非access-controll-allow-origin: *
    // 因此这里发起的请求并无卵用，不过可以把img转file而以
    return new Promise((res) => {
        const a = new XMLHttpRequest();
        a.open('get', url);
        // 设置请求返回类型
        a.responseType = 'blob';
        a.onreadystatechange = function () {
            if (a.readyState == 4) {
                res(a.response);
            }
        };
        a.send();
    });
}

export default function cutFun(info) {
    const {
        imgInfo = {
            w: 100,
            h: 100,
            src: '', // 图片地址
        },
        cut = {
            w: 100,
            h: 100,
            x: 100,
            y: 100,
        },
        scale = 1,
        state,
    } = info;
    return new Promise((res) => {
        urlToFile(imgInfo.src)
            // .then(rotate) // 此处不需要rotate，因为需要Pinch和cut的图片默认展示逻辑一致
            .then(toImg)
            .then(($img) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = cut.w * scale;
                canvas.height = cut.h * scale;
                // 先位移、再缩放、再旋转，需要注意旋转角度与Pinch的旋转角度相反
                ctx.translate(state.x + cut.x * scale, state.y + cut.y * scale);
                ctx.scale(state.scale, state.scale);
                ctx.rotate(-state.rotate);
                ctx.drawImage($img, 0, 0, imgInfo.w * scale, imgInfo.h * scale);

                canvas.toBlob(
                    (file) => {
                        res({
                            file,
                            base64: canvas.toDataURL(),
                        });
                    },
                    'image/jpeg',
                    1
                );
            })
            .catch((err) => console.error(err));
    });
}
