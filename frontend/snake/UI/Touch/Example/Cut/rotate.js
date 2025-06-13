// 旋转图片，因为图片拍摄可能会旋转
import './exif';

function rotateImg(img, rotateDeg) {
    const canvas = document.createElement('canvas');
    let { naturalWidth: width, naturalHeight: height } = img;
    let [widthCache, heightCache] = [width, height];

    // 如果旋转90、270需要交换宽高
    const isRotate90 = rotateDeg % 180 != 0;
    if (isRotate90) {
        [widthCache, heightCache] = [width, height];
        [width, height] = [height, width];
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.fillRect(0, 0, widthCache, heightCache);
    ctx.fillRect = 'pink';
    ctx.fill();
    ctx.restore();
    ctx.save();
    // 移动到中心
    ctx.translate(width / 2, height / 2);
    // 旋转
    ctx.rotate(-(Math.PI / 180) * rotateDeg);
    // 平移回起点
    if (isRotate90) {
        ctx.translate(-height / 2, -width / 2);
    } else {
        ctx.translate(-width / 2, -height / 2);
    }
    ctx.drawImage(img, 0, 0, widthCache, heightCache);
    ctx.restore();

    return new Promise((resolve) => {
        canvas.toBlob(
            (file) => {
                resolve(file);
            },
            'image/jpeg',
            1
        );
    });
}

export default function rotate(file) {
    return new Promise((resolve) => {
        const { EXIF } = window;
        const img = new Image();
        img.onload = () => {
            // pc端不需要对图片进行旋转
            // 移动端ios需要、Android需要
            // 只有本地图片才需要旋转，如果是网络图片默认不旋转
            // if (PC) {
            //     resolve(file)
            //     return
            // }

            // 获取图片信息进行旋转
            EXIF.getData(img, function () {
                const allMetaData = EXIF.getAllTags(this);

                // 如果图片是角度不正，则旋转图片
                const { Orientation = 1 } = allMetaData;

                if (Orientation != 1) {
                    let deg = 0;
                    switch (Orientation) {
                        case 3:
                            deg = 180;
                            break;
                        case 6:
                            deg = -90;
                            break;
                        case 8:
                            deg = 90;
                            break;
                        default:
                    }

                    if (deg === 0) {
                        resolve(file);
                    } else {
                        // 旋转图片
                        rotateImg(img, deg, file).then(resolve);
                    }
                } else {
                    resolve(file);
                }
            });
        };
        img.src = URL.createObjectURL(file);
    });
}
