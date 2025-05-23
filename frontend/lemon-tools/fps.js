/**
 * 计算1s内requestAnimationFrame被调用的次数来计算帧率
 * @param {Function} callback
 */
export function setup(callback) {
    let baseTime = Date.now();
    let stack = 0;
    const next = () => {
        requestAnimationFrame(() => {
            stack += 1;
            const now = Date.now();
            if (now - baseTime >= 1000) {
                callback && callback(stack);
                stack = 0;
                baseTime = now;
            }
            next();
        });
    };
    next();
}
