/**
 * 输出并返回
 * @param  {...any} any
 * @returns
 */
export function returnLog(...any) {
    console.log('returnLog::', ...any);
    return any[0];
}
