export function mouseScroll() {
    new WatchSwipeEvent();
}

class TimerProtect {
    constructor(throttleTime = 0) {
        this.throttleTime = throttleTime;
        this.nowTime = 0;
    }
    isReturn() {
        const now = Date.now();
        if (now - this.nowTime < this.throttleTime) {
            return true;
        }
        this.nowTime = now;
        return false;
    }
}

class WatchSwipeEvent {
    constructor(option = {}) {
        this.option = option;
        this.addEvents();
        this.protect = new TimerProtect(1000);
    }

    addEvents() {
        // pc监听wheel事件，和按键上下左右事件
        window.addEventListener(
            'wheel',
            (event) => {
                if (event.deltaX < 0) {
                    event.preventDefault();
                }
                const state = {
                    toNext: event.deltaY > 0,
                    toPrev: event.deltaY < 0,
                    x: event.deltaX,
                    y: event.deltaY,
                    z: event.deltaZ,
                };
                if (event.deltaY != 0 && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                    if (this.protect.isReturn()) return;
                    console.log(state);
                    this.option.onChange?.(state, event);
                }
            },
            { passive: false }
        );

        // TODO: 移动端监听touch事件
    }
}
