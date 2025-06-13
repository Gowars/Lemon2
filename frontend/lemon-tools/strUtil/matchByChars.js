/**
 * 比如: matchByChars('aa1234bb', 'aa', 'bb') // 输出1234
 * @param {string} str
 * @param {string} startStr
 * @param {string} endStr
 */
export function matchByChars(str, startStr, endStr) {
    const index = str.indexOf(startStr);
    if (index === -1) {
        return '';
    }
    const end = str.slice(index + startStr.length);
    const endIndex = end.indexOf(endStr);
    if (endIndex === -1) {
        return '';
    }
    return end.slice(0, endIndex);
}
