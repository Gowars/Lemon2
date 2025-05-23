/**
 * 滚动到指定dom的顶部
 * 如果顶部有fixed元素遮挡时，可指定relative
 * offset用来指定额外的位移量
 * scroller指定滚动元素，默认为html
 * @param {{ dom: HTMLElement, relative: HTMLElement, offset: number, scroller: HTMLElement }} option
 * @returns
 */
export function scrollTo(option) {
    const $scroller = option.scroller || document.documentElement;
    const baseTop = option.scroller?.getBoundingClientRect().top ?? 0;
    const getDom = (v) => (v instanceof HTMLElement ? v : $scroller.querySelector(v));
    let top = getDom(option.dom)?.getBoundingClientRect().top - baseTop;
    const rect = option.relative && getDom(option.relative)?.getBoundingClientRect();
    if (rect) {
        top = top - (rect.top - baseTop + rect.height);
    }
    $scroller.scrollTop += top + (option.offset || 0);
}

// scrollTo({ dom: '.category-row', relative: '.nav-bar' })
// scrollTo({ dom: Array.from(document.querySelectorAll('.scroller .item'))[1], relative: '.fixedInner', scroller: document.querySelector('.scroller') })
