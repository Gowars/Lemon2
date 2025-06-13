import { os, merge } from './helper';
import BrowserHistory, { actionType } from './router/createHistroy';
import createMiddleware from './createMiddleware';
import { MultiPageApp, getPageNums } from './render';

/** @type { BrowserHistory } */
let router;
let rawPush;
let rawReplace;

export function getRouter() {
    if (!router) {
        throw new Error('router还未完成初始化！');
    }
    return router;
}

/**
 * @param {{ hashMode: boolean }} option
 * @returns
 */
export function createRouter(option) {
    // 提供matchBefore钩子函数，给业务判断是否需要返回历史堆栈内的缓存页面
    router = new BrowserHistory({
        hashMode: option.hashMode,
        defaultState: {
            animation: !os.pc,
        },
    });

    router.on('change', (state) => {
        const { url, action } = state;
        // 第一次渲染和返回的时候
        if ([actionType.BACK, actionType.LOAD, actionType.FORWARD].includes(action)) {
            routerMiddleware.run({ url, action, info: {}, getPageNums });
        }
    });

    rawPush = router.push;
    rawReplace = router.replace;

    // push/replace -> url处理 + 资源加载 + 真实修改history + 页面渲染
    // pop -> 资源加载 + 页面渲染
    router.push = (url, info) => {
        routerMiddleware.run({ url, info: info || {}, action: actionType.PUSH, getPageNums });
    };

    router.replace = (url, info) => {
        routerMiddleware.run({ url, info: info || {}, action: actionType.REPLACE, getPageNums });
    };
    return router;
}

export function triggerRouterInit() {
    router.noticeChange(router.current);
}

export const routerMiddleware = createMiddleware((ctx) => {
    const { url, info, action } = ctx;

    if (action === actionType.PUSH) {
        rawPush.call(router, url, info); // 进入原始比较
    } else if (action === actionType.REPLACE) {
        rawReplace.call(router, url, info); // 进入原始比较
    }

    // 处理类似于管理后台式的页面切换操作，只切换路由，但不触发页面渲染
    if (ctx.noRender) {
        return;
    }

    if (!MultiPageApp.self) {
        console.error('请确保已经执行过setup函数');
        return;
    }

    // 调用页面渲染
    MultiPageApp.self.renderPages({
        current: router.current,
        prev: router.prevState,
        ctx, // 把ctx传递过去
    });
});

if (window.module?.hot) {
    let timeout;
    window.mhrRenderPage = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            // TODO: 根组件状态保存
            const current = merge({ state: {} }, router.current, {
                action: actionType.REPLACE,
                state: { animation: false },
            });

            MultiPageApp.self.renderPages({
                current,
                prev: router.prevState,
                forceRender: true,
                ctx: {}, // 把ctx传递过去
            });
        }, 200);
    };
}
