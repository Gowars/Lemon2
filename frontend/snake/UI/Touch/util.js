// 小工具
export default {
    classname(...anys) {
        const classes = [];
        const getType = (any) =>
            Object.prototype.toString
                .call(any)
                .match(/([^\s]+)]$/)[1]
                .toLowerCase();
        const handle = (any) => {
            switch (getType(any)) {
                case 'string':
                case 'number':
                    classes.push(any);
                    break;
                case 'array':
                    any.forEach(handle);
                    break;
                case 'object':
                    Object.keys(any).forEach((key) => {
                        any[key] && classes.push(key);
                    });
                    break;
                default:
                    break;
            }
        };

        anys.forEach(handle);

        return classes.join(' ');
    },
    /**
     * 获取指定的父级元素
     * @param {*} child
     * @param {*} [root=document.body]
     * @param {*} fn
     * @returns {HTMLElement}
     */
    parent(child, root = document.body, fn) {
        let parent = child;
        while (parent && parent !== root) {
            const result = parent instanceof HTMLElement && fn(parent);
            if (result) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return null;
    },
    style($dom, styles) {
        $dom.style.cssText += styles;
    },
    Timeout: class {
        queue = [];

        add(fn, time) {
            if (time > 0) {
                let t;
                const item = (exec = true) => {
                    clearTimeout(t);
                    exec && fn();
                };
                t = setTimeout(() => {
                    fn();
                    this.queue = this.queue.filter((i) => i !== item);
                }, time);
                this.queue.push(item);
            } else {
                fn();
            }
            return this;
        }

        clear() {
            this.queue.forEach((i) => i(false));
            this.queue = [];
            return this;
        }

        done() {
            this.queue.forEach((i) => i());
            this.queue = [];
            return this;
        }
    },
    setTimeout(fn = () => {}, time = 0) {
        if (time > 0) {
            return setTimeout(fn, time);
        }
        return fn();
    },
    // requestAnimationFrame 提升性能
    RAF(...fns) {
        fns.forEach((fn) => (window.requestAnimationFrame ? requestAnimationFrame(fn) : fn()));
    },
    // 数组对比
    equalArr(arr1 = [], arr2 = []) {
        return arr1.length == arr2.length && arr1.every((i, index) => arr2[index] == i);
    },
    position(ele) {
        const eleRect = ele.getBoundingClientRect();
        const pRect = ele.parentElement.getBoundingClientRect();
        return {
            left: eleRect.left - pRect.left,
            top: eleRect.top - pRect.top,
        };
    },
    getOrigin($dom) {
        const { left, right, top, bottom, width, height } = $dom.getBoundingClientRect();

        return {
            left,
            right,
            top,
            bottom,
            width,
            height,
        };
    },
    transition($doms = [], time = 0) {
        const transition = time > 0 ? `${time}s cubic-bezier(0.25, 0.8, 0.25, 1)` : 'none';
        $doms.forEach((ele) => {
            ele.style.cssText += `;
                -webkit-transition: ${transition};
                transition: ${transition};
            `;
        });
    },
    getParent(child, parent) {
        // parent 可以是dom/class str/id str
        let $p = child;
        let match = false;
        while ($p !== document.body) {
            if ($p === parent) {
                match = true;
                break;
            } else {
                $p = $p.parentElement;
            }
        }
        return match ? $p : null;
    },
};
