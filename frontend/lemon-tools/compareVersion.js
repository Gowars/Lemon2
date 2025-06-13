/**
 * 比较版本号a,b大小，返回：大于0表示a>b，小于0表示a<b，等于0表示a=b
 * 比如 1.2.1 > 1.2.01  1.2 == 1.2.0   2 < 2.0.1
 * @param {string} [a='']
 * @param {string} [b='']
 * @returns {number}
 */
export function version(a = '', b = '') {
    const [a1, b1] = [a, b].map((str) =>
        String(str)
            .trim()
            .split('.')
            .map((i) => Number(i) || 0)
    );

    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < Math.max(a1.length, b1.length); index++) {
        const compareResult = (a1[index] ?? 0) - (b1[index] ?? 0);
        if (compareResult !== 0) {
            return compareResult;
        }
    }
    return 0;
}

/**
 *  @typedef {"="|"=="|">="|">"|"<="|"<"} OperatorLike
 * 比较字符串版本号大小
 *
 * @param {string|number} a
 * @param {OperatorLike} operator
 * @param {string|number} b
 * @returns {boolean}
 */
export function compareVersion(a, operator, b) {
    switch (operator) {
        case '==':
        case '=': {
            return version(a, b) === 0;
        }
        case '>=': {
            return version(a, b) >= 0;
        }
        case '>': {
            return version(a, b) > 0;
        }
        case '<=': {
            return version(a, b) <= 0;
        }
        case '<': {
            return version(a, b) < 0;
        }
        default: {
            throw new Error('错误的运算符号');
        }
    }
}
