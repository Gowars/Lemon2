/**
 * 根据多参数生成className字符串
 * @export
 * @param {string|boolean|Object|Array<any>} args
 * @returns {string}
 */
export default function cx(...args) {
    return args
        .map((item) => {
            if (typeof item === 'string') {
                return item;
            }

            if (typeof item === 'function') {
                return item();
            }

            if (Array.isArray(item)) {
                return cx(...item);
            }

            if (Object.prototype.toString.call(item).match(/object\]/i)) {
                return Object.keys(item)
                    .map((i) => (item[i] ? i : ''))
                    .join(' ');
            }

            return '';
        })
        .join(' ')
        .trim()
        .replace(/\s+/, ' ');
}
