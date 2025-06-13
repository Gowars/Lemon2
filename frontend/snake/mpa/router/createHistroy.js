import { EventBus } from './EventBus';
import uuid from './uuid';

const { history, location } = window;

export const actionType = {
    LOAD: 'load',
    BACK: 'back',
    FORWARD: 'forward',
    PUSH: 'push',
    REPLACE: 'replace',
};

/*
before change 概念
在跳转到某个页面之前，需要进行判断，是否可以跳转过去
1. 路由跳转后做替换
    不可逆，势必会新增一个路由
2. 路由跳转前做劫持
    用户体验好，但是需要做复杂判断
*/
export default class BrowserHistory extends EventBus {
    /**
     *
     * @param {{ hashMode: boolean, defaultState: any }} option
     */
    constructor(option) {
        super();
        this.isHashMode = option.hashMode;
        // eslint-disable-next-line prefer-object-spread
        this.option = Object.assign(
            {
                defaultTitle: '',
                defaultState: {},
            },
            option
        );

        // 会把refer放到state中，方便处理
        this.current = {
            index: Number(history.state?.index) || 0,
            key: uuid(8),
            url: this.getDefaultUrl(),
            refer: history.state?.refer || document.referrer || '',
            referArr: history.state?.referArr || [],
            action: actionType.LOAD,
            state: history.state?.state || {},
        };
        window.addEventListener('popstate', async (event) => {
            const { index = 0, url = this.getDefaultUrl(), refer = '', state = {}, referArr = [] } = event.state || {};

            this.noticeChange({
                index,
                url,
                refer,
                referArr,
                state,
                action: index > this.current.index ? 'forward' : actionType.BACK,
            });
        });
    }

    noticeChange(newState) {
        this.prevState = this.current;
        this.current = {
            ...newState,
            eventFrom: this.from || '', // 事件监听者知道事件是被谁触发的
        };

        this.trigger('change', newState, this.prevState);
        this.trigger(newState.action, newState, this.prevState);
        this.from = '';
    }

    // 修改前
    // url发生变化后
    push(url, state) {
        this.from = 'push';
        // 需要添加一个beforePush的hooks，添加上报，或者页面路由映射
        const newState = {
            index: (Number(this.current.index) || 0) + 1, // index 有可能是一个异常的值
            url,
            referArr: [...this.current.referArr, this.current.url].slice(-5),
            refer: this.current.url,
            action: actionType.PUSH,
            state: state || this.option.defaultState,
        };
        this.noticeChange(newState);
        history.pushState(newState, this.option.defaultTitle || '', this.toFinalUrl(newState.url));
    }

    replace(url, state) {
        this.from = 'replace';
        const newState = {
            ...this.current,
            url,
            action: actionType.REPLACE,
            state: state || this.option.defaultState,
        };
        this.noticeChange(newState);
        history.replaceState(newState, this.option.defaultTitle || '', this.toFinalUrl(newState.url));
    }

    go(index = 0) {
        this.from = 'go';
        history.go(index);
    }

    back() {
        this.from = 'back';
        history.back();
    }

    forward() {
        this.from = 'forward';
        history.forward();
    }

    /**
     * 监听history变化，并且会被立马触发一次
     * @param {string} name
     * @param {Function} fn
     */
    watch(name, fn) {
        this.on(name, fn);
        fn(this.current, this.current);
    }

    toFinalUrl(url) {
        if (this.isHashMode) {
            return location.origin + location.pathname + '#' + url;
        }
        return url;
    }

    getDefaultUrl() {
        if (this.isHashMode) {
            return location.hash.slice(1);
        }
        return location.href;
    }
}
