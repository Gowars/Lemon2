/**
 * 优先使用平滑滚动
 * @param {HTMLElement} element
 * @param {number} target
 * @param {string} direction
 *
 * @example
 * ```js
 * // 页面滚动到100
 * scrollTo(document.documentElement, 100)
 * ```
 */
export function scrollTo(element, target, direction = 'y') {
    if (element.scrollTo) {
        if (direction == 'y') {
            element.scrollTo({
                left: element.scrollLeft,
                top: target,
                behavior: 'smooth',
            });
        } else {
            element.scrollTo({
                left: target,
                top: element.scrollTop,
                behavior: 'smooth',
            });
        }
    } else {
        if (direction == 'y') {
            element.scrollTop = target;
        } else {
            element.scrollLeft = target;
        }
    }
}
