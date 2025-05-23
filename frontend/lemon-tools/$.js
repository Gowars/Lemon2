const $HOOKS = '__$__id__';
let id = 0;
const events = {};

// 校验selector是否能匹配上target， 暂时不支持复杂选择器
function checkSelector(selector, target) {
    if (!target) {
        return false;
    }
    // 复杂解析器，使用右递归
    if (typeof selector !== 'string') {
        return selector === target;
    }
    // className
    if (selector.startsWith('.') && target.classList.contains(selector.slice(1))) {
        return true;
    }

    // id
    if (selector.startsWith('#') && target.id == selector.slice(1)) {
        return true;
    }

    // tagName
    if (/^[a-zA-Z]/.test(selector) && target.tagName.toLowerCase() === selector.toLowerCase()) {
        return true;
    }

    return false;
}

// 事件委托
// 把事件监听委托给父元素，父元素根据event.target来判断指定dom节点有没有响应
// 在委托的时候，父元素是存在的，因此可以再父元素上添加标示，对应jquery的事件中心，也不必为元素重复监听相同事件
// 事件被触发后，在每一层都对其委托的事件/ selector进行匹配，然后触发对应事件
function dispatchEvent(ID, EVENT_TYPE, event, TARGET) {
    // 加入一个事件缓存中
    const eventStore = (events[ID] = events[ID] || {});
    const { cbs = [] } = eventStore;
    cbs.forEach((item) => {
        const { selector, callback, eventType } = item;

        if (EVENT_TYPE == eventType && checkSelector(selector, TARGET)) {
            callback.call(TARGET, event, TARGET);
        }
    });
}

class $$ {
    constructor(selector) {
        const TYPE = Object.prototype.toString.call(selector);

        // 字符串
        if (TYPE.match(/string/i)) {
            // 匹配选择器 (.|#|[)?(\w|\-)+
            if (/^([.|#|[]?\w+[-\s\w]*)+$/.test(selector)) {
                this.eles = Array.from(document.querySelectorAll(selector) || []);
            } else {
                // var frg = document.createDocumentFragment()
                const a = document.createElement('div');
                a.innerHTML = selector;
                return $(Array.from(a.children));
            }
        } else if (TYPE.match(/nodelist|HTMLCollection/i)) {
            // nodeList querySelectorAll
            this.eles = [...selector];
        } else if (TYPE.match(/element/i)) {
            // 这些类型 HTMLHtmlElement SVGSVGElement
            // html querySelector
            this.eles = [selector];
        } else if (TYPE.match(/array/i)) {
            const isDOMArray = selector.every((node) => Object.prototype.toString.call(node).match(/html/i));

            // 判断是不是一个DOM array
            if (isDOMArray) {
                this.eles = selector;
            } else {
                throw new Error('selector should be a DOM array');
            }
        } else {
            throw new Error(`$ cannot support ${TYPE} type`);
        }

        this.eles.forEach((ele) => {
            if (ele[$HOOKS] === undefined) {
                ele[$HOOKS] = id++;
            }
        });
    }

    trigger(eventType, selector) {
        this.on(eventType, selector);
    }

    // 为元素添加事件
    on(eventType, selector, callback) {
        if (!callback && typeof selector === 'function') {
            callback = selector;
            selector = '';
        }

        this.eles.forEach((ele) => {
            // 加入一个事件缓存中
            const ID = ele[$HOOKS];

            const eventStore = (events[ID] = events[ID] || {});
            const cbs = (eventStore.cbs = eventStore.cbs || []);
            const listeners = (eventStore.listeners = eventStore.listeners || {});

            // 不存在callback就立即执行
            if (!callback) {
                cbs.forEach((item) => {
                    eventType && item.eventType && item.selector == (selector || ele) && item.callback.call(this);
                });
                return this;
            }

            // 是否绑定过事件，如果没有就绑定一个
            if (!listeners[eventType]) {
                const listener = function (event) {
                    let { target } = event;
                    while (target && target !== event.currentTarget.parentElement) {
                        dispatchEvent(ID, eventType, event, target);
                        target = target.parentElement;
                    }
                };

                listeners[eventType] = listener;
                ele.addEventListener(eventType, listener);
            }

            cbs.push({
                eventType,
                selector: selector || ele,
                callback,
            });
        });

        return this;
    }

    // 为元素移除事件
    off(eventType, selector, callback) {
        if (!callback && typeof selector === 'function') {
            callback = selector;
            selector = '';
        }

        this.eles.forEach((ele) => {
            const ID = ele[$HOOKS];
            const eventStore = events[ID] || {};
            const { cbs = [] } = eventStore;

            // 移除相关
            eventStore.cbs = cbs.filter((item) => {
                if (eventType !== item.eventType) {
                    return true;
                }

                if (selector && selector !== item.selector) {
                    return true;
                }

                if (callback && callback !== item.callback) {
                    return true;
                }

                return false;
            });

            const { listeners = {} } = eventStore;
            const listener = listeners[eventType];
            if (listener) {
                const ARR = eventStore.cbs.filter((item) => item.eventType === eventType);
                // 如果相关事件集合为空，就removeEventListener
                if (!ARR.length) {
                    ele.addEventListener(eventType, listener);
                    Reflect.deleteProperty(listeners, eventType);
                }
            }
        });

        return this;
    }

    offset() {
        // offsetTop表示元素与其父元素的距离
        const { bottom, right, top, left, height, width } = this.position();
        const { bottom: pBottom, right: pRight, top: pTop, left: pLeft } = this.parent().position();
        return {
            top: top - pTop,
            left: left - pLeft,
            bottom: pBottom - bottom,
            right: pRight - right,
            height,
            width,
        };
    }

    // top left bottom right 相对视窗的位置
    position() {
        const rect = this.eles[0].getBoundingClientRect();
        const { top, bottom, left, right, height, width } = rect;

        return {
            top,
            bottom,
            left,
            right,
            height,
            width,
        };
    }

    parent() {
        const parents = this.eles.map((ele) => ele.parentElement);
        return $(parents);
    }

    /**
     * 获取包含指定className的父元素
     * @param {string} selector
     * @returns
     * @memberof $$
     */
    parents(selector) {
        selector = selector.replace(/^./, '');
        const parents = this.eles
            .map((ele) => {
                let node = ele;
                while (node) {
                    if (node.classList.contains(selector)) {
                        return node;
                    }
                    node = node.parentElement;
                }
                return null;
            })
            .filter((i) => i);
        return $(parents);
    }

    width() {
        return this.eles[0].clientWidth;
    }

    height() {
        return this.eles[0].clientHeight;
    }

    index() {
        const [ele] = this.eles;
        return Array.from(ele.parentElement.children).findIndex((i) => i === ele);
    }

    eq(index) {
        return $(this.eles[index]);
    }

    each(cb) {
        this.eles.forEach((ele, index) => {
            cb.call(ele, index);
        });
        return this;
    }

    _fixStylePre(key) {
        // lineHeight
        return key.replace(/[A-Z]/g, (matchStr) => `-${matchStr.toLowerCase()}`);
    }

    style(styles) {
        // 自动实现css前缀补全
        let str = ';';

        Object.keys(styles).forEach((key) => {
            const newKey = this._fixStylePre(key);
            str += `${newKey}:${styles[key]};`;
        });

        this.eles.forEach((ele) => {
            ele.style.cssText += str;
        });

        return this;
    }

    // 隐藏
    hide() {
        this.eles.forEach((ele) => {
            ele.__displayCache = getComputedStyle(ele, null).display;
            ele.style.display = 'none';
        });

        return this;
    }

    // 显示
    show() {
        this.eles.forEach((ele) => {
            if (ele.__displayCache) {
                ele.style.display = ele.__displayCache;
                ele.__displayCache = '';
            }
        });
        return this;
    }

    // 支持空格
    hasClass(className) {
        const list = className.split(/\s+/);
        return this.eles.every((ele) => list.every((i) => ele.classList.contains(i)));
    }

    addClass(...classNames) {
        classNames.forEach((className) => {
            const list = className.split(/\s+/);
            this.eles.forEach((ele) => list.forEach((i) => ele.classList.add(i)));
            return this;
        });
        return this;
    }

    removeClass(...classNames) {
        classNames.forEach((className) => {
            const list = className.split(/\s+/);
            this.eles.forEach((ele) => list.forEach((i) => ele.classList.remove(i)));
        });
        return this;
    }

    toggleClass(className) {
        const list = className.split(/\s+/);
        this.eles.forEach((ele) => list.forEach((i) => ele.classList.toggle(i)));
        return this;
    }

    /**
     * [append description]
     * @method append
     * @param  {[type]} $ele [接受字符串/dom/$ele]
     * @return [type]        [description]
     */
    _cloneNodes(node, parent) {
        parent = parent || document.createDocumentFragment();
        const cloneNode = node.cloneNode();
        parent.appendChild(cloneNode);
        Array.from(node.childNodes || []).forEach((node) => {
            this._cloneNodes(node, cloneNode);
        });

        return parent;
    }

    //  对于append
    append($ele) {
        // string, dom, $ele, html字符串
        const $eles = $($ele).eles;
        const MAX = this.eles.length - 1;
        this.eles.forEach((ele) => {
            $eles.forEach((i) => {
                const cloneI = i === MAX ? i : this._cloneNodes(i);
                ele.appendChild(cloneI);
            });
        });
        return this;
    }

    preppend($ele) {
        const $eles = $($ele).eles;
        const MAX = this.eles.length - 1;
        this.eles.forEach((ele, index) => {
            $eles.forEach((i) => {
                const cloneI = index === MAX ? i : this._cloneNodes(i);
                ele.insertBefore(cloneI, ele.firstChild);
            });
        });
        return this;
    }

    after($ele) {
        const $eles = $($ele).eles;
        const MAX = this.eles.length - 1;
        this.eles.forEach((ele, index) => {
            $eles.forEach((i) => {
                const cloneI = index === MAX ? i : this._cloneNodes(i);
                ele.nextSibling
                    ? ele.parentElement.insertBefore(cloneI, ele.nextSibling)
                    : ele.parentElement.appendChild(cloneI);
            });
        });
        return this;
    }

    before($ele) {
        const $eles = $($ele).eles;
        const MAX = this.eles.length - 1;
        this.eles.forEach((ele, index) => {
            $eles.forEach((i) => {
                const cloneI = index === MAX ? i : this._cloneNodes(i);
                ele.parentElement.insertBefore(cloneI, ele);
            });
        });

        return this;
    }

    siblings() {
        const arr = [];
        this.eles.map((ele) => {
            arr.push(...Array.from(ele.parentElement.children).filter((i) => i !== ele));
        });
        return $(arr);
    }

    next() {
        return $(this.eles.forEach((ele) => ele.nextElementSibling));
    }

    prev() {
        return $(this.eles.forEach((ele) => ele.previousElementSibling));
    }

    remove() {
        this.eles.forEach((ele) => {
            ele.parentElement.removeChild(ele);
        });
    }

    empty() {
        this.eles.forEach((ele) => {
            ele.innerHTML = '';
        });

        return this;
    }

    get [0]() {
        return this.eles[0];
    }

    /**
     * 判断筛选出来的元素个数
     * @readonly
     * @memberof $$
     */
    get length() {
        return this.eles.length;
    }
}

function $(selector) {
    if (selector instanceof $$) {
        return selector;
    }
    return new $$(selector);
}

export default $;
