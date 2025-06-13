// 基于performance来获取所有的网络请求
// 局限性：获取到ws链接，并且其内部实现是一个有限长度的buffer
// https://developer.mozilla.org/en-US/docs/Web/API/Performance/clearResourceTimings

class WatchRequest {
    constructor(filter) {
        this.list = [];
        this.filter = filter;

        // ios safari不支持此方法，但是desktop支持
        if (performance.clearResourceTimings) {
            performance.addEventListener('resourcetimingbufferfull', () => {
                this.save();
            });
        }

        setInterval(() => {
            this.save();
        }, 2000);

        const st = document.createElement('style');
        st.textContent = `
            .use-raw-image {
                box-shadow: inset 5px 5px 0 0 rgba(0, 0, 255, .7), inset -5px -5px 0 0 rgba(0, 0, 255, .7);
                outline: 2px solid rgba(0, 0, 255, .7);
            }
        `;
        document.head.appendChild(st);
    }

    save() {
        const newList = performance
            .getEntries()
            .filter((i) => (this.filter ? this.filter(i) : true))
            .map((i) => i.name);
        this.list = this.list.concat(newList);
        performance.clearResourceTimings();
        newList.length && this.showTagOnDom();
    }

    showBorder(ele, src) {
        if (this.list.includes(src)) {
            ele.classList.add('use-raw-image');
        }
    }

    showTagOnDom() {
        Array.from(document.querySelectorAll('div')).map((ele) => {
            this.showBorder(ele, ele.style.backgroundImage.match(/http[^'")]+/)?.[0]);
        });

        Array.from(document.querySelectorAll('img')).map((ele) => {
            this.showBorder(ele, ele.src);
        });
    }
}

new WatchRequest((i) => {
    return i.name.includes('cdn.wei') && i.name.match(/(static|sky)\//);
});
