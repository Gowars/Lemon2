function postData(url, data) {
    const xhr = new XMLHttpRequest();
    xhr.open('post', url);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.send(JSON.stringify(data));
}

export class LazyReport {
    /**
     * 上报接口
     * @param {string} url
     */
    constructor(url, timePool = 10 * 1000) {
        this.reportUrl = url;
        this.buffer = [];
        setInterval(() => {
            this.forceReport();
        }, timePool);
    }

    forceReport = () => {
        if (this.buffer.length) {
            postData(this.reportUrl, this.buffer);
            this.buffer = [];
        }
    };

    /**
     * 立即上报
     * @param {*} data
     */
    report = (data) => {
        postData(data);
    };

    /**
     * 延迟上报
     * @param {*} data
     */
    lazy = (data) => {
        this.buffer.push(data);
        if (this.buffer.length >= 10) {
            this.forceReport();
        }
    };

    listenHide() {
        // https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event#usage_notes
        // 关于如何监听页面关闭事件，MDN上有一篇文章已经讲的很明白了
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.buffer.length) {
                // https://caniuse.com/?search=sendBeacon
                // ios >= 11.3 android >= 5
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(this.reportUrl, this.buffer);
                    this.buffer = [];
                } else {
                    this.forceReport();
                }
            }
        });
    }
}

/** 可放在html中，用于存储初始数据 */
export const ltReport = (function createReport() {
    var list = [];
    return {
        push(item) {
            list.push(item);
        },
        get() {
            return list.shift();
        },
        getAll() {
            var copy = list;
            list = [];
            return copy;
        },
    };
})();
