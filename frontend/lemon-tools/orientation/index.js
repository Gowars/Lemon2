class MyOrientation {
    constructor() {
        this.state = this.getState();

        window.addEventListener('orientationchange', () => {
            this.state = this.getState();
            this.listener.forEach((i) => i(this.state));
        });
    }

    getState() {
        const { angle, type } = screen.orientation;
        // 移动端可以提示用户旋转手机，达到竖屏状态
        const needRotate =
            (type == 'landscape-primary' && angle == 90) || (type == 'landscape-secondary' && angle == 270);

        return {
            angle,
            type,
            needRotate,
        };
    }

    listener = [];

    /**
     * @param {(state: ScreenOrientation & { needRotate: boolean }) => Function} fn
     * @returns
     */
    watch = (fn) => {
        this.listener.push(fn);
        fn(this.state);
        return () => {
            this.listener = this.listener.filter((i) => i !== fn);
        };
    };
}

const mo = new MyOrientation();

export function watchOrientation(fn) {
    return mo.watch(fn);
}
