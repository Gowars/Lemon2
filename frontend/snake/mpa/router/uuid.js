const ARR = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789-_'.split('');

/**
 * [uuid 获取一个随机id]
 * @method uuid
 * @param  {Number} [length=8] [id长度]
 * @return {String}         [随机id]
 */
export default function uuid(length = 8) {
    return Array.from({ length })
        .map(() => ARR[Math.floor(Math.random() * ARR.length)])
        .join('');
}
