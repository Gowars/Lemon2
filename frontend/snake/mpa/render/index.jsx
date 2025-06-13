import { createRoot } from 'react-dom/client';
import React, { PureComponent } from 'react';

import { urlParse, os } from '../helper';
import match from '../match';
import { actionType } from '../router/createHistroy';
import PageControl from './PageControl';
import { triggerRouterInit } from '../history.patch';
import { ErrorBoundary } from './error';
import { PageLifecycle, callLifecycle } from './callLifecycle';
import { popstateChecker } from './PopStateChecker';

/**
 * 获取当前被渲染的页面个数
 */
export function getPageNums() {
    if (MultiPageApp.self) {
        return MultiPageApp.self.pageCtrl.list.length;
    }
    return 0;
}

/**
 * 应用根组件，承载页面 Pages + Sidebar + Header + Footer
 */
class Rooter extends PureComponent {
    static defaultProps = {
        layout: (any) => any,
    };

    state = {
        url: this.props.url,
        // 为了保证业务page渲染的root永远存在，不会随着layout的重新渲染而重新创建
        root: document.createElement('div'),
    };

    update(url) {
        this.setState({ url });
    }

    render() {
        return this.props.layout(<div ref={(v) => v && v.appendChild(this.state.root)} />, this.state.url);
    }
}

/**
 * 应用的Pages组件
 */
export class MultiPageApp {
    /** @type {MultiPageApp} */
    static self = null;

    /**
     * 应用实例化
     * @param {{ getRouterToComponent: Function, getExtComp: Function, onPageAppear: Function }} option
     * @memberof MultiPageApp
     */
    constructor(option) {
        this.instanceOption = option;
        MultiPageApp.self = this;
        const root = createRoot(option.root);

        // 先渲染root再渲染业务
        root.render(
            <Rooter
                url={location.href}
                layout={option.rootLayout}
                ref={(ins) => {
                    this.rootIns = ins;
                    this.pageCtrl = new PageControl({
                        root: ins.state.root,
                        domCacheNum: option.maxPages || 5,
                    });

                    triggerRouterInit();
                }}
            />
        );
    }

    getProps(url) {
        const location = urlParse(url);
        const { pathname, query } = location;
        const { router, params, value } = match(pathname, this.instanceOption.getRouterToComponent());

        return {
            PageComponent: value.value,
            props: { router, params, query, location, url },
        };
    }

    /**
     * 页面渲染
     * @param currentState 当前state
     * @param prevState 上一个state，用来指定页面返回类型，是否需要动画
     * @memberof MultiPageApp
     */
    renderPages = ({ current: currentState, forceRender = false, prev: prevState }) => {
        const { action, index, url, state } = currentState;
        const { PageComponent, props } = this.getProps(url);
        const { instanceOption } = this;
        const getPageConfig = () => this.instanceOption.getPageConfig({ router: props.router, PageComponent });

        // pop 也需要render
        const option = {
            keepAlive: getPageConfig()?.keepAlive,
            pageConfig: getPageConfig(),
            onPageAppear({ dom }) {
                instanceOption.onPageAppear({ ...props, dom, PageComponent });
                callLifecycle(dom, 'onPageAppear');
            },
            onPageShow({ dom }) {
                // 触发跟组件的onPageShow
                this.onPageAppear({ dom });
                callLifecycle(dom, 'onPageShow');
            },
            onPageHide({ dom }) {
                callLifecycle(dom, 'onPageHide');
            },
            onUnmount({ dom }) {
                this.onPageHide({ dom });
                callLifecycle(dom, 'onPageUnmount');
                this.reactRoot.unmount();
            },
            // 始终返回一个class component，以支持function类型的根组件
            getClassComponent() {
                if (PageComponent.prototype.isReactComponent) {
                    return PageComponent;
                }
                return class Root extends React.PureComponent {
                    render() {
                        return <PageComponent {...this.props} />;
                    }
                };
            },
            onRender({ dom }) {
                const ClassComponent = this.getClassComponent();
                dom.setAttribute('data-router', props.router);
                dom.setAttribute('data-url', props.url);
                props.$dom = dom;

                const pageInstance = (
                    <ErrorBoundary>
                        <ClassComponent
                            {...props}
                            ref={(ins) => {
                                dom.react = ins;
                                // 卸载也会调用
                                if (ins) {
                                    callLifecycle(dom, 'onPageMount');
                                    this.onPageAppear({ dom });
                                }
                            }}
                        />
                    </ErrorBoundary>
                );
                dom.pageLifecycle = new PageLifecycle();

                const reactRoot = createRoot(dom);
                this.reactRoot = reactRoot;
                reactRoot.render(instanceOption.getExtComp({ ...props, dom, pageInstance, PageComponent }));
            },
        };

        // update pc sidebar & header
        this.rootIns.update(props.url);

        if (action === actionType.BACK) {
            let animation = prevState.state?.animation && !os.pc;
            // 如果存在eventFrom则表明，事件是被用户从History刻意触发的，排除手势返回事件
            if (!currentState.eventFrom) {
                animation = animation && !popstateChecker.fromSwipe;
            }
            this.pageCtrl.pop(index, {
                ...option,
                animation,
                animationType: prevState.state?.animationType,
            });
        } else {
            let animation = action !== actionType.LOAD && !os.pc && state.animation;
            if (!currentState.eventFrom) {
                animation = animation && !popstateChecker.fromSwipe;
            }
            this.pageCtrl.push(index, {
                ...option,
                animation,
                animationType: state.animationType,
                forceRender,
                replace: action == actionType.REPLACE,
            });
        }
    };
}

export function setup(option) {
    return new MultiPageApp(option);
}
