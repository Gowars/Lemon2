const [start, end, leave, cancel] = !navigator.userAgent.match(/phone|pad|ios|android/)
    ? ['mousedown', 'mouseup', 'mouseleave', 'mousecancel']
    : ['touchstart', 'touchend', 'touchleave', 'touchcancel'];

const deep = 20
const effectElements = []
document.documentElement.addEventListener(start, (event) => {
    let $ele = event.target;
    let index = 0
    while ($ele) {
        if ($ele instanceof HTMLElement && $ele.getAttribute('data-effect')) {
            $ele.classList.add('touch-effect-ing');
            effectElements.push($ele)
        }
        $ele = $ele.parentNode;
        index += 1
        if (index > deep) {
            break
        }
    }
});

const handleEnd = () => {
    // 注意 $ele 有可能为null
    while (effectElements.length) {
        const item = effectElements.shift()
        item.classList.remove('touch-effect-ing');
        if (effectElements.length == 0) {
            break
        }
    }
};

document.documentElement.addEventListener(end, handleEnd);
document.documentElement.addEventListener(leave, handleEnd);
document.documentElement.addEventListener(cancel, handleEnd);
