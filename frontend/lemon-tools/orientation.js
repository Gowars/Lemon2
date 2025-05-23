// https://developer.mozilla.org/en-US/docs/Web/API/Window/orientation

/**
 * 屏幕方向
 */
export const ORIENTATION = {
    /** 竖屏 */
    portrait: 'portrait',
    /** 横屏 */
    landscape: 'landscape',
};

function getDirection() {
    const orientation = window.screen?.orientation?.angle ?? window?.orientation;

    if ([90, -90].includes(orientation)) {
        return ORIENTATION.landscape;
    } else {
        return ORIENTATION.portrait;
    }
}

/**
 * 获取屏幕方向
 * @param {(direction: string) => void} fn
 * @returns
 */
export function watchOrientation(fn) {
    fn(getDirection());
    const handler = () => {
        fn(getDirection());
    };
    window.addEventListener('orientationchange', handler);

    return () => {
        window.removeEventListener('orientationchange', handler);
    };
}
