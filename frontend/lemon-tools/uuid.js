const ARR = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789'.split('');

/**
 * [uuid 获取一个随机id]
 * @method uuid
 * @param  {Number} [length=8] [id长度]
 * @return {String}         [随机id]
 */
export function uuid(length = 8, list = ARR) {
    return Array.from({ length })
        .map(() => list[Math.floor(Math.random() * list.length)])
        .join('');
}

/**
 * 生成32位的uuid
 * 此uuid的规范：连续两位数符合十六进制规范
 * @returns
 */
export function uuid32() {
    return [8, 4, 4, 4, 12].map((i) => uuid(i, 'abcdef0123456789')).join('-');
}
