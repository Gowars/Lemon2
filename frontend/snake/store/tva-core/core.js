// https://dvajs.com/guide/getting-started.html#connect-%E8%B5%B7%E6%9D%A5
// https://umijs.org/zh/guide/load-on-demand.html#%E6%8C%89%E9%9C%80%E5%8A%A0%E8%BD%BD%E7%BB%84%E4%BB%B6
// https://github.com/immerjs/immer
import { produce, original } from 'immer'; // copy-on-write
import getType from '../utils/getType';
import { getState, dispatch as storeDispatch } from './store';

// interface IdispatchAction {
//     type: string;
//     // 不响应的
//     excludeNamespace?: string[];
//     [key: string]: any;
// }

export function logDraft(draft) {
    console.log(original(draft)); // eslint-disable-line
}

// export interface Imodel {
//     namespace: string;
//     state: object;
//     plugin: any[];
//     reducer?: {
//         [key: string]: Function;
//     };
//     effect?: {
//         [key: string]: Function;
//     };
//     subscribe?: {
//         [key: string]: Function;
//     };
// }

// interface IallModel {
//     [key: string]: Imodel;
// }

const allModel = {}; // 缓存添加的model
const middleware = []; // 添加的中间件

export function addModel(state, model) {
    const { namespace } = model;
    model.state = state;
    if (getType(model.state) !== 'object') {
        throw new Error('model.state should be a plain object');
    }
    if (namespace === 'subscribe') {
        throw new Error('model.namespace cannot equal subscribe!!!');
    }
    if (!allModel[namespace]) {
        allModel[namespace] = model;
        let { state: intialState } = model;

        model.plugin
            && model.plugin.forEach((item) => {
                const { modelWillInit } = item;
                if (typeof modelWillInit === 'function') {
                    intialState = Object.assign(intialState, modelWillInit(intialState, { namespace }));
                }
            });

        storeDispatch(
            produce(getState(), (draftState) => {
                draftState[namespace] = intialState;
            }),
        );
    }

    return {
        state,
        dispatch: (option) => {
            /* eslint no-use-before-define: 0 */
            dispatch({ ...option, type: `${model.namespace}/${option.type}` });
        },
    };
}

export function unmodel(namespace = '') {
    delete allModel[namespace];
    storeDispatch(
        produce(getState(), (draftState) => {
            draftState[namespace] = undefined;
            delete draftState[namespace];
        }),
    );
}

export function setDispatchMiddleWare(newMWS) {
    newMWS && middleware.unshift(...newMWS);
}

// 最简单的中间件实现
function execOnion(middlewares = []) {
    return middlewares.reduceRight((prev, next) => next(getState)(prev));
}

export function dispatch(action) {
    return execOnion(middleware)(action);
}

export function getHandlers(namespace) {
    return {
        put({ type, ...otherAction }) {
            return dispatch({
                type: `${namespace}/${type}`,
                ...otherAction,
            });
        },
        others({ type, ...otherAction }) {
            return dispatch({
                excludeNamespace: [namespace], // 忽略不执行
                type: `subscribe/${type}`,
                ...otherAction,
            });
        },
    };
}

function getCtx(namespace) {
    const modelState = getState()[namespace];
    return {
        dispatch,
        getState,
        namespace,
        state: modelState,
        ...getHandlers(namespace),
    };
}

function applyDispatch(action) {
    const { type = '' } = action;
    // 只支持 modelName/reducerName
    const [namespace, reducerName] = type.split('/');
    const model = allModel[namespace];

    // 事件广播
    if (namespace === 'subscribe') {
        reducerName
            && Object.keys(allModel).forEach((modelName) => {
                // 自己忽略不执行
                if (action.excludeNamespace && action.excludeNamespace.includes(modelName)) {
                    return;
                }
                const { subscribe: sub = {} } = allModel[modelName];

                if (sub[reducerName]) {
                    sub[reducerName](action, getCtx(modelName));
                }
            });
        return null;
    }

    if (model) {
        let promiseReducerResult;
        const { reducer = {}, effect = {} } = model;
        // 只能通过namespace/actionName形式disptach
        if (reducer[reducerName]) {
            const ctx = {
                getState,
                namespace,
            };

            const prevState = getState();
            const prevModelState = prevState[namespace];

            const newState = produce(prevState, (draft) => {
                reducer[reducerName](draft[namespace], action, ctx);
            });

            const nextModelState = newState[namespace];
            storeDispatch(newState);

            if (prevModelState !== nextModelState) {
                model.plugin
                    && model.plugin.forEach((item) => {
                        typeof item.modelDidUpdate === 'function'
                            && item.modelDidUpdate(nextModelState, {
                                prevState: prevModelState,
                                namespace,
                            });
                    });
            }
        } else if (effect[reducerName]) {
            promiseReducerResult = effect[reducerName](action, getCtx(namespace));

            // 如果return的是函数会立即执行，递归到结束为止
            while (getType(promiseReducerResult) === 'function') {
                promiseReducerResult = promiseReducerResult();
            }
            return promiseReducerResult;
        }
    }
    return null;
}

middleware.push(applyDispatch);
