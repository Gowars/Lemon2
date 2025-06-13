// 通过request跨域图片，然后转成一个本地图片，以供canvas使用
function urlToImg(url) {
    return new Promise((resolve) => {
        const a = new XMLHttpRequest();
        a.open('get', url);
        // 设置请求返回类型
        a.responseType = 'blob';
        a.onreadystatechange = function () {
            if (a.readyState == 4) {
                const file = a.response;
                const newUrl = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    resolve(img);
                };
                img.src = newUrl;
            }
        };
        a.send();
    });
}

/**
 * [为图片添加水印]
 * @param  {Object} [options={}] [description]
 * @return {[type]}              [description]
 */
export function addWater(options = {}) {
    const {
        src = '',
        waterSrc = '',
        percent = 0.1,
        position = 0,
        // text = 'water',
        // fontSize = '14px',
        // color = 'rgba(0, 0, 0, .2)',
    } = options;

    return new Promise((res) => {
        Promise.all([src, waterSrc].filter((i) => i.trim()).map(urlToImg)).then(([$img, $water] = []) => {
            const canvas = document.createElement('canvas');
            const width = (canvas.width = $img.naturalWidth);
            const height = (canvas.height = $img.naturalHeight);

            const ctx = canvas.getContext('2d');
            // 需要添加水印图片
            ctx.drawImage($img, 0, 0, width, height);

            // 水印图片
            const waterWidth = $water.naturalWidth;
            const waterHeight = $water.naturalHeight;
            // 计算后宽高
            const w = ($water.width = width * percent);
            const h = ($water.height = ((width * percent) / waterWidth) * waterHeight);
            let center = {};
            switch (position) {
                case 0: {
                    center = {
                        x: (width - w) / 2,
                        y: (height - h) / 2,
                    };
                    break;
                }
                case 1: {
                    center = {
                        x: 0,
                        y: 0,
                    };
                    break;
                }
                case 2: {
                    center = {
                        x: width - w,
                        y: 0,
                    };
                    break;
                }
                case 3: {
                    center = {
                        x: width - w,
                        y: height - h,
                    };
                    break;
                }
                case 4: {
                    center = {
                        x: 0,
                        y: height - h,
                    };
                    break;
                }
                default:
            }

            ctx.drawImage($water, center.x, center.y, w, h);

            canvas.toBlob(
                (file) => {
                    res(file);
                },
                'image/jpeg',
                1
            );
        });
    });
}
