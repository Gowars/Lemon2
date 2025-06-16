// @ts-check
import { model, getState, useTva } from "@/snake/store/index.js";
import { storage } from "@/lemon-tools/storage.js";
import { callGo } from "../home/core.js";

const stateCache = (key) => ({
    modelWillInit(initState) {
        return {
            ...initState,
            ...storage.getItem(key),
        };
    },
    modelDidUpdate(newState) {
        // eslint-disable-next-line no-unused-vars
        const { comments, ...willCacheState } = newState;
        storage.setItem(key, willCacheState);
        callGo("save-front-config", JSON.stringify(newState));
    },
});

function getInitState() {
    return {
        pacMode: "off",
        subscribes: [], // 订阅地址
        tag: "", // 当前选中的server ps
        config: {}, // 当前配置信息
        manualConfig: [], // 手动添加的配置
        remotePacUrl: "",
        httpPort: 1078,
        socksPort: 7890,
        pacPort: 7891,
        v2rayIP: "0.0.0.0",
        gfwUrl: "https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt",
        pacDirect: "[]",
        pacProxy: "[]",
        AppDir: "",
    };
}

const state = getInitState();

const namespace = "app-v0.0.1";
const { dispatch: dispatchApp } = model(state, {
    namespace,
    plugin: [stateCache("app-v0.0.1")], // 做一个缓存
    reducer: {
        updateState(draft, { data, runner }) {
            data &&
                Object.keys(data).forEach((key) => {
                    draft[key] = data[key];
                });
            runner && runner(draft);
        },
    },
    effect: {
        getConfig(_, { put }) {
            callGo("get-config").then((result) => {
                put({ type: "updateState", data: { config: result } });
            });
        },
    },
});

export { dispatchApp };

/**
 *
 * @returns {state}
 */
export function getAppState() {
    return getState()[namespace];
}

/**
 *
 * @returns {state}
 */
export function useAppState() {
    return useTva(namespace);
}

/**
 * @param {state} newState
 * @param {(x: state) => state} runner
 */
export function setAppState(newState, runner) {
    dispatchApp({ type: "updateState", data: newState, runner });
}

export function resetAppState() {
    dispatchApp({ type: "updateState", data: getInitState() });
}
