import {
    addModel as model, unmodel, dispatch, setDispatchMiddleWare, logDraft,
} from './tva-core/core';

import { getState, subscribe } from './tva-core/store';

// import connect from './tva-react/connect';

export * from './tva-react/hooks';

// interface IFTvaOption {
//     middleware?: Function[];
//     onStateChange?: Function;
// }

function init(option) {
    // 添加中间件
    setDispatchMiddleWare(option.middleware);
    // 监听state变化
    if (option.onStateChange) {
        subscribe(option.onStateChange);
    }
}

export {
    init, model, unmodel, dispatch, getState, subscribe, logDraft,
};
