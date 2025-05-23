const initState = {
    width: 0,
    height: 0,
    cssHeight: '',
    cssMinHeight: '',
    cssText: '',
};

export class WatchWindowSize {
    constructor() {
        this.list = [];
        this.state = initState;
        this.handler();
        /**
         * ios pwa模式下，请保持页面dom高度填满100vh
         * 否则window.innerHeight会小于window.screen.height
         */
        window.addEventListener('resize', this.handler);
    }

    get() {
        return { ...this.state };
    }

    handler = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        console.log(height);
        this.state = {
            width,
            height,
            cssHeight: `height: ${height}px;`,
            cssMinHeight: `min-height: ${height}px;`,
            cssText: `width: ${width}px; height: ${height}px;`,
        };
        this.list.forEach((fn) => fn(this.state));
    };

    /**
     * @callback watchCallback
     * @param {initState} size
     */

    /**
     *
     * @param {watchCallback} callback
     * @returns
     */
    watch(callback, immediatelyExec = false) {
        if (immediatelyExec) {
            callback(this.state);
        }
        this.list.push(callback);
        return () => {
            this.list = this.list.filter((i) => i !== callback);
        };
    }

    unmount = () => {
        window.removeEventListener('resize', this.handler);
    };
}

export const watchWindowSize = new WatchWindowSize();
