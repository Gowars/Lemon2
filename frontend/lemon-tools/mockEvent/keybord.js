/**
 * // Based on http://stackoverflow.com/a/10520017/1307721 and http://stackoverflow.com/a/16022728/1307721
 * 看起来还不是很完美
 * @param {number} k
 */
export function mockKeybordEvent(k) {
    var oEvent = document.createEvent('KeyboardEvent');

    // Chromium Hack
    Object.defineProperty(oEvent, 'keyCode', {
        get: function () {
            return this.keyCodeVal;
        },
    });
    Object.defineProperty(oEvent, 'key', {
        get: function () {
            return '';
        },
    });
    Object.defineProperty(oEvent, 'which', {
        get: function () {
            return this.keyCodeVal;
        },
    });

    if (oEvent.initKeyboardEvent) {
        oEvent.initKeyboardEvent('keydown', true, true, document.defaultView, k, k, '', '', false, '');
    } else {
        oEvent.initKeyEvent('keydown', true, true, document.defaultView, false, false, false, false, k, 0);
    }

    oEvent.keyCodeVal = k;

    if (oEvent.keyCode !== k) {
        alert('keyCode mismatch ' + oEvent.keyCode + '(' + oEvent.which + ')');
    }

    document.body.dispatchEvent(oEvent);
}

/**
 * 触发某个位置的元素的点击事件
 * @param {number} x
 * @param {number} y
 */
export function mockClickXY(x, y) {
    // https://stackoverflow.com/questions/3277369/how-to-simulate-a-click-by-using-x-y-coordinates-in-javascript
    // 前端开发10年，才第一次发现这个api😭
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/elementFromPoint
    document.elementFromPoint(x, y).click();
}
