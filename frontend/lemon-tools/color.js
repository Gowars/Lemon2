/**
 * 生成随机颜色
 * @export
 * @param {string} [type='rgb']
 * @returns
 */
export function randomColor(type = 'rgb', opacity = Math.random()) {
    const RGB = [1, 2, 3].map(() => Math.min(Math.round(Math.random() * 255), 255));
    switch (type) {
        case 'rgb':
            return `rgb(${RGB.join(',')})`;
        case 'rgba':
            return `rgba(${RGB.join(',')}, ${opacity})`;
        // 16进制
        default: {
            const SS = '0123456789abcdefg';
            const SYSTEM = 16;
            return `#${RGB.map((i) => {
                let s = '';
                while (i) {
                    s = SS[i % SYSTEM] + s;
                    i = Math.floor(i / SYSTEM);
                }
                return s;
            }).join('')}`;
        }
    }
}

/**
 * toRGB 16进制字符串转rgb
 * @method toRGB
 * @param  {String} [str='#ffffff'] [description]
 * @return {[type]}                 [返回RGB字符串]
 */
export function toRGB(str = '#ffffff') {
    const newStr = str.replace('#', '').toLowerCase();

    // 校验rgb是否正常
    if (!/^#?[a-f0-9]{6}$/i.test(newStr)) {
        console.error('字符串长度必须为6');
    }

    const rgb = [newStr.slice(0, 2), newStr.slice(2, 4), newStr.slice(4, 6)].map((i) => {
        return parseInt(i, 16);
    });

    return `rgb(${rgb.join(',')})`;
}

/**
 * rgba?转16进制
 * @export
 * @param {string} [rgbStr='']
 * @returns {string}
 */
export function to16Color(rgbStr = '') {
    if (!/^rgb/i.test(rgbStr)) {
        return rgbStr;
    }
    const [r, g, b] = rgbStr.match(/\d+/g);
    return `#${[r, g, b]
        .map((i) => Number(i) || 0)
        .map((i) => i.toString(16).padStart(2, '0'))
        .join('')}`;
    // 自己实现10 -> 16进制逻辑
    // const chars = '0123456789abcdef'
    // return `#${[r, g, b].map(i => Number(i) || 0).map(n => [~~(n / 16), n % 16].map(i => chars[i]).join('')).join('')}`
}
