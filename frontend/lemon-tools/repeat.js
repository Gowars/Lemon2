/**
 * 重复执行多少次
 * @export
 * @param {function} fn
 * @param {number} [time=1]
 */
export default function repeat(fn, time = 1) {
    while (time > 0) {
        fn(time);
        time -= 1;
    }
}
