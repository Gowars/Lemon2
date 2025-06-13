import Sub from '../utils/Sub';

const stateSub = new Sub();
let state = {};
// let timeout;

// 可能有坑，state发生变化，不会同步通知订阅者
// 那还不如同步更新，应用侧自己做处理
function triggerUpdate() {
    // clearTimeout(timeout);
    // timeout = setTimeout(() => {
    // });
    stateSub.trigger(state);
}

export function initState(newState = {}) {
    state = Object.assign(state, newState);
}

export function getState() {
    return state;
}

export function dispatch(newState) {
    if (newState === state) return;
    state = newState;
    triggerUpdate();
}

export function subscribe(fn) {
    return stateSub.add(fn);
}
