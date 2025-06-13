import Events from './events';
import getKeyName from './keys';

const MAIN_KEYS = ['cmd', 'alt', 'ctrl'];

function isSame(keys = '', name = '') {
    const keysArr = keys
        .split('+')
        .map((i) => i.trim())
        .filter((i) => i);
    const nameArr = name
        .split('+')
        .map((i) => i.trim())
        .filter((i) => i);

    return (
        keysArr.length === nameArr.length &&
        keysArr.every((i) => nameArr.includes(i)) &&
        nameArr.every((i) => keysArr.includes(i))
    );
}

export default class HotKey extends Events {
    mainKeys = {};

    get allSK() {
        // 只有值大于0的才算当前已摁下的按键
        return Object.keys(this.mainKeys).filter((i) => this.mainKeys[i] > 0);
    }

    /**
     *Creates an instance of HotKey.
     * @param {HTMLElement} [$ele=window] 指定被监听对象
     * @memberof HotKey
     */
    constructor($ele = window) {
        super();
        this.$ele = $ele;
        this.option = {};
        this.addEvents();
    }

    config(option) {
        this.option = option || {};
        return this;
    }

    // 通过UI的形式展示当前的激活按键
    log(content) {
        if (!this.option.log) return;
        if (!this.$log) {
            const div = document.createElement('div');
            div.style.cssText += `
                position: fixed;
                bottom: 0%;
                left: 50%;
                transform: translate(-50%, 0%);
                pointer-events: none;
                width: max-content;
                font-size: 20px;
                color: red;
                opacity: .2;
                z-index: 10000;
            `;
            document.body.appendChild(div);
            this.$log = div;
        }
        this.$log.textContent = content;
    }

    handleKeydown = (/**@type {KeyboardEvent}*/ event) => {
        // 记录是不是特殊的按键
        // 特殊按钮激活的情况下，监听不到其他按键的keyup事件
        const keyCode = getKeyName(event.keyCode);
        const tmpKey = [];
        if (MAIN_KEYS.includes(keyCode)) {
            this.mainKeys[keyCode] = 1;
        } else {
            tmpKey.push(keyCode);
        }

        // const keys = this.allSK.concat(tmpKey).join('+');
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
        // 直接使用event中的属性来判断特殊key是否active
        const keys = [
            event.metaKey && 'cmd',
            event.shiftKey && 'shift',
            event.altKey && 'option',
            event.ctrlKey && 'ctrl',
        ]
            .concat(tmpKey)
            .filter((i) => i)
            .join('+');

        this.log(keys);
        const option = { keys, stopPropagation: false };
        this.trigger('*', event, option);

        if (option.stopPropagation) return;

        Object.keys(this.__eventsCache).forEach((name) => {
            name.replace('option', 'alt'); // mac上option和alt做一个转换
            if (isSame(name, keys)) {
                this.trigger(name, event);
            }
        });
    };

    handleKeyup = (/**@type {KeyboardEvent}*/ event) => {
        const keyCode = getKeyName(event.keyCode);
        if (MAIN_KEYS.includes(keyCode)) {
            this.mainKeys[keyCode] = 0;
        }
    };

    handleBlur = (/** @type {KeyboardEvent} */ event) => {
        if (event.target === this.$ele) {
            this.clearAllKeys();
        }
    };

    addEvents() {
        const option = {
            capture: false,
        };
        this.$ele.addEventListener('keydown', this.handleKeydown, option);
        this.$ele.addEventListener('keyup', this.handleKeyup, option);
        // 在元素失去焦点的时候，应当清空keys，因为有可能一些刷新/收藏之类的事件
        this.$ele.addEventListener('blur', this.handleBlur, option);
    }

    unmount = () => {
        this.$ele.removeEventListener('keydown', this.handleKeydown);
        this.$ele.removeEventListener('keyup', this.handleKeyup);
        this.$ele.removeEventListener('blur', this.handleBlur);
        this.$log && this.$log.remove();
    };

    clearAllKeys() {
        this.normalKeys = {};
        this.mainKeys = {};
    }
}
