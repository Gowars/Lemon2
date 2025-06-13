// file -> base64
function fileToBase64(file) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function load() {
            const { naturalWidth } = img;
            const { naturalHeight } = img;

            const canvas = document.createElement('canvas');
            canvas.width = naturalWidth;
            canvas.height = naturalHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const url = canvas.toDataURL();
            resolve(url);
        };

        img.src = typeof file === 'string' ? file : URL.createObjectURL(file);
    });
}

/**
 * [handleBase64 选取图片，获取一个它的base64]
 * @return {Promise} [获取base64]
 */
export default function handleBase64() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.cssText = 'display: none;';
        input.accept = 'image/png,image/jpg,image/jpeg,image/webp';
        document.body.appendChild(input);

        input.onchange = function change() {
            fileToBase64(this.files[0]).then(resolve);
            document.body.removeChild(input);
        };

        input.click();
    });
}
