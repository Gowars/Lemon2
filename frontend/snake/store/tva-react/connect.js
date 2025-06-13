import * as React from 'react'; // eslint-disable-line import/no-extraneous-dependencies
import * as PropTypes from 'prop-types'; // eslint-disable-line import/no-extraneous-dependencies
import { getState, subscribe } from '../tva-core/store';
import { dispatch } from '../tva-core/core';
import Sub from '../utils/Sub';
import shallowEqual from '../utils/shallowEqual';

// interface IFConnectOption {
//     selector?: (allState: object, props: object) => object;
//     effect?: (
//         allState: object,
//         props: object
//     ) => {
//         unmount?: Function;
//         displayName?: string;
//     };
//     withRef?: boolean;
//     displayName?: string;
// }

// interface IFNewComponentState {
//     state: any
// }

// interface IFNewComponentProps {
// }

function defaultSelector() {
    return {};
}

function getNewState(selector, props) {
    return selector(getState(), props) || {};
}

export default function connect(connectOption = {}) {
    const { selector = defaultSelector } = connectOption;
    // 从props获取store// 获取全局默认store
    return (Comp) => class NewComponent extends React.Component {
        static displayName = `Connect[${connectOption.displayName || Comp.displayName || Comp.name}]`;

        // 父组件提供context，子组件默认从context取store
        // 子组件从父组件监听store的变化
        static contextTypes = {
            sub: PropTypes.instanceOf(Sub),
        };

        static childContextTypes = {
            sub: PropTypes.instanceOf(Sub),
        };

        static componentClass = Comp;

        // sub: Sub;

        // effectResult: any;

        // removeSubListener: any;

        // unmount: boolean;

        // wrappedInstance: any;

        // storeHandleCache: any;

        constructor(props, context) {
            super(props, context);

            this.sub = new Sub();

            // 执行前期操作，方便新建store
            // 并且此操作一次实例化只会操作一次
            this.effectResult = connectOption.effect && connectOption.effect(props, getState);

            this.state = {
                state: getNewState(selector, props),
            };

            this.removeSubListener = context.sub ? context.sub.add(this.update) : subscribe(this.update);
        }

        getChildContext() {
            return {
                sub: this.sub,
            };
        }

        // 性能优化
        shouldComponentUpdate(nextProps, nextState) {
            const { state } = this.state;

            if (shallowEqual(nextState.state, state) && shallowEqual(nextProps, this.props)) {
                return false;
            }
            return true;
        }

        componentWillUnmount() {
            this.unmount = true;

            this.removeSubListener();
            // 卸载一下
            if (this.effectResult) {
                this.effectResult.unmount(this.props);
            }
        }

        setWrappedInstance = (ref) => {
            this.wrappedInstance = ref;
        }

        update = () => {
            // 已卸载组件不再执行setState
            if (this.unmount) return;

            const nextState = getNewState(selector, this.props);
            // 判断是否需要更新
            if (!shallowEqual(this.state.state, nextState)) {
                // 父组件更新完毕再通知子组件更新
                this.setState(
                    {
                        state: nextState,
                    },
                    () => {
                        this.sub && this.sub.trigger();
                    },
                );
            } else {
                this.sub && this.sub.trigger();
            }
        };

        // 有可能会导致业务上的不清晰，我的action type到底指向哪里呢？无法一眼看出来
        addExtraProps() {
            const withExtras = {
                ...this.props,
                ...this.state.state,
            };

            withExtras.dispatch = dispatch;

            if (connectOption.withRef) withExtras.ref = this.setWrappedInstance;
            return withExtras;
        }

        render() {
            return React.createElement(Comp, this.addExtraProps());
        }
    };
}
