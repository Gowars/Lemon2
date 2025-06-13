// 对于IOS如果手势返回，会触发浏览器级别的页面返回动画，此时js层面的页面返回动画应该被取消
// 可惜的是，我们并不能从popstate事件中判断是否是手势返回
// 监听页面的touchstart事件，做一个简单的hack
// 如果是hitory的push/back操作，就不再hack
class PopStateChecker {
    constructor(distance = 25) {
        this.fromSwipe = false;
        this.distance = distance;
        this.path = location.href;
        this.addEvents();
    }

    addInterval() {
        setInterval(() => {
            if (location.href != this.path) {
                this.reset();
                this.path = location.href;
            }
        }, 200);
    }

    reset() {
        this.fromSwipe = false;
    }

    onStart = (e) => {
        // logger.log('false')
        if (e.touches[0].clientX > this.distance && e.touches[0].clientX < window.innerWidth - this.distance) {
            return;
        }
        // logger.log('enable')

        this.fromSwipe = true;
        if (this.timer) {
            clearTimeout(this.timer);
        }
    };

    onEnd = () => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.reset();
        }, 200);
    };

    addEvents() {
        window.addEventListener('touchstart', this.onStart, {
            capture: true,
        });
        window.addEventListener('touchend', this.onEnd, {
            capture: true,
        });
    }
}

export const popstateChecker = new PopStateChecker();
