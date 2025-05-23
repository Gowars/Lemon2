const isIos = window.navigator.userAgent.match(/iphone|ios|ipad/i);
const isPhone = window.navigator.userAgent.match(/phone|android|ios/i);
const isPC = !window.navigator.userAgent.match(/phone|android|ios|pad/i);
const [touchstart, touchmove, touchend, touchleave] = isPhone
    ? ['touchstart', 'touchmove', 'touchend', 'touchcancel']
    : ['mousedown', 'mousemove', 'mouseup', 'mouseleave'];
const IOS_SYSTEM_SWIPE_WIDTH = 45; // ios系统返回触发宽度

export {
    touchstart, touchmove, touchend, touchleave, isIos, isPhone, isPC, IOS_SYSTEM_SWIPE_WIDTH,
};

export const TOUCH_DIRECTION = {
    leftToRight: 'lr',
    topToBottom: 'ud',
};

export const TOUCH_ACTION = {
    swipe: 'swipe',
    pinch: 'pinch',
}
