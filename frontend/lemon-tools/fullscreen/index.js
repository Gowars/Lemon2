export class Fullscreen {
    /**
     * @param {HTMLElement} dom 进入全屏的元素
     * @param {Function} onExit 监听退出事件
     */
    constructor(dom, onExit) {
        this.dom = dom;
        this.onExit = onExit;
    }

    toggle = () => {
        if (!this.active) {
            this.enter();
        } else {
            this.exit();
        }
        return this;
    };

    enter = () => {
        if (this.active) return this;
        this.active = true;
        this.dom.requestFullscreen();
        this.addEvents();
        this.winHeight = window.innerHeight;
        return this;
    };

    exit = () => {
        if (!this.active) return this;
        this.active = false;
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
        document.fullscreenElement && document.exitFullscreen();
        this.onExit && this.onExit();
        return this;
    };

    addEvents() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('resize', this.onResize);
        document.addEventListener('fullscreenchange', this.onFullscreenChange);
    }

    onKeyDown = (e) => {
        // 点击esc按钮
        if (e.keyCode == 27) {
            this.exit();
        }
    };

    onResize = () => {
        // 因为无法监听到mac：手动点击浏览器左上角退出全屏按钮
        // 因此这里通过监听window height的值变小了，来hack一下
        const nowHeight = window.innerHeight;
        if (nowHeight < this.winHeight) {
            setTimeout(this.exit, 1000);
        }
        this.winHeight = nowHeight;
    };

    onFullscreenChange = () => {
        // 如果发现dom不一致
        if (document.fullscreenElement != this.dom) {
            this.exit();
        }
    };
}
