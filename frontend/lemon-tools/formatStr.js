export function formatV8(str = '', format = []) {
    let newStr = '';
    let index = 0;
    let start = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const item = format[index];
        if (!item) {
            newStr += str.slice(start);
            break;
        } else {
            const chars = str.slice(start, start + item.len);
            newStr += chars;
            start += item.len;
            if (chars.length == item.len && str[start]) {
                newStr += item.char;
                index += 1;
            } else {
                newStr += str.slice(start);
                break;
            }
        }
    }
    return newStr;
}

/**
 * formatV8Fast('18668065162', '3-4-4')
 * 3个数字，4个数字，4个数字
 * @param {*} str
 * @param {*} format
 * @returns
 */
export function formatV8Fast(str = '', format = '') {
    const list = format.match(/\d+\D+/g).map((i) => {
        return {
            len: Number(i.match(/\d+/)[0]),
            char: i.match(/\D+/)[0],
        };
    });

    return formatV8(str, list);
}

/**
 * 对价格进行格式化，从左到右进按照len长度行分割，可以指定小数点个数
 * @param  {Number} [num=0]   [description]
 * @param {{ len: number, char: string, fixed: number }} option
 * @return {String}
 * @example
 * formatPrice(12345) // 输出 12,345
 * formatPrice(12345.0) // 输出 12,345.0
 * formatPrice(12345, { fixed: 2 }) // 输出 12,345.00
 */
export default function formatPrice(num = 0, option = {}) {
    const { len = 3, fixed = 0, char = ',' } = option;
    if (fixed && fixed > 0) {
        num = Number(num).toFixed(fixed);
    }
    return String(num).replace(/^\d+/g, (intStr) => {
        const arr = [];
        while (intStr) {
            const L = intStr.length % len || len;
            arr.push(intStr.slice(0, L));
            intStr = intStr.slice(L);
        }
        return arr.join(char);
    });
}

/**
 * 用于对数字字符串进行格式化，比如说手机号、银行卡号等
 * 可以通过len指定字符串的切割规则 [3] 会一直按照3个一组进行切割 [3,4]会先按照[3,4,4,4]进行切割
 * @export
 * @param {string} [num='']
 * @param {{ len: Array<number>, char: string }} [{ len = [3], char = ',' }={}]
 * @returns
 * @example
 * formatNum('18668061234', { len: [3, 4], char: ' ' }) // 手机号格式化
 */
export function formatNum(num = '', { len = [3], char = ',' } = {}) {
    let intStr = String(num);
    const arr = [];
    let index = 0;
    while (intStr) {
        if (!len[index]) return intStr;
        arr.push(intStr.slice(0, len[index]));
        intStr = intStr.slice(len[index]);
        if (index < len.length - 1) {
            index += 1;
        }
    }
    return arr.join(char);
}

/**
 * 移除价格小点尾部的0
 * @export
 * @param {string} priceStr
 * @returns
 * @example
 * removePriceZero('1.20') // 输出 1.2
 * removePriceZero('1.020') // 输出 1.02
 * removePriceZero('1.00') // 输出 1
 */
export function removePriceZero(priceStr) {
    return String(priceStr).replace(/\.\d+/, (all) => all.replace(/\.?0+$/, ''));
}

export { formatPrice };

export function formatCurrency(amount) {
    //truncate the amount to 0 decimals
    //for every digit that is followed by 3 digits and a word boundary
    //add a comma
    amount = amount.toFixed(0).replace(/(\d)(?=(\d{3})+\b)/g, '$1,');
    return amount;
}
