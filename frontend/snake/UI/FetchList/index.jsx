import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { http } from '@/lemon-tools/ajax';
import { Scroll, scroll } from '@/lemon-tools/scroll';
import { storage } from '@/lemon-tools/storage';
import $ from '@/lemon-tools/$';
import { getShare } from '@/snake/main/share';
import { useBetterState } from '@/snake/useLib';
import { getProps } from '@/lemon-tools/getProps';
import Modal from '../Modal';

/**
 * 滚动加载
 * Provider: 默认为window，也可以为其他dom元素
 * direction: tb|lf 默认为上下加载
 * maxDistance: 会触发回调的最大距离 px|rem|vh都支持
 */

function getData(url = '', params = {}, callback) {
    http(url, {
        body: params,
        timeout: 20 * 1000,
    }).then((res) => callback(res));
}

const LOADING_STYLE = {
    lineHeight: '60px',
    textAlign: 'center',
};

const EMPTY = <div style={{ paddingTop: '40px', textAlign: 'center' }}>没有查询到相关数据</div>;

const LOADING = <div style={LOADING_STYLE}>数据加载···</div>;

const LOADING_MORE = <div style={LOADING_STYLE}>加载更多···</div>;

// react 18 可能会导致forwardRef的defaultProps无效
// 暂时懒得验证了https://github.com/facebook/react/issues/16653
const defaultProps = {
    /** 首屏数据 */
    firstScreenData: [],
    /** 左右滚动还是上下滚动 */
    direction: 'down',
    /** 距离还有多少的时候触发数据加载 */
    distance: 2000,
    /** 接口地址 */
    api: '',
    /** 参数 */
    params: {},
    /** 数据预处理 */
    preHandleData: (any) => any,
    /** 根据上次请求结果提供新的params */
    handleParams: (any) => ({ page: any.page || '' }),
    /** 如果本页数据小于此值，且没有加载完毕，自动请求下一页数据 */
    autoRequestNext: 0,
    /** 滚动监听对象 */
    target: null,
    /** 第一次加载loading */
    Loading: LOADING,
    /** 加载更多的loading */
    LoadingMore: LOADING_MORE,
    /** 空数据占位 */
    Empty: EMPTY,
    Template: () => {},
    /** 父组件传递给子组件的信息 */
    parent: {},
    /** 当fetchKey发生变化的时候，会重新请求数据 */
    fetchKey: '',
    /** 是否缓存接口数据 */
    useApiCache: false,
    /**
     * 为了用户体验，在重置fetchKey的时候，不会重置state
     * 但是如何在指定时间内没有获取到数据，就强制重置state，避免用户误解
     */
    waitNextReuqestTime: 500,
    className: '',
    style: null,
};

/**
 *
 * @param {defaultProps} props
 * @returns
 */
function FetchListCore(props, ref) {
    const mixProps = getProps(props, defaultProps);
    const { state, stateRef, setState } = useBetterState({
        items: [], // 列表数据
        isEnd: false, // 分页请求是否结束
        requested: false, // 标识一下是否进行过请求了
        updateKey: 1,
    });

    const $p = useRef();
    const allRef = useRef({
        ajaxing: false,
        freezeUpdate: false,
        waitTimeout: -1,
        mixProps: {},
        removeScroll: () => {},
    });

    allRef.current.mixProps = mixProps;

    useImperativeHandle(
        ref,
        () => {
            return {
                /*
                 * 支持修改修改items，以方便父组件对items进行增删改
                 * 这其实在业务中是一个强需求，例如删除了某些数据，在页面的头部新增了部分数据
                 * 而本组件其实只是进行了网络请求的封装
                 * 那么其实还可以分装一个网络请求的组件，不负责列表的渲染
                 */
                modifyList(callback) {
                    setState({
                        items: callback(stateRef.current.items),
                    });
                },
            };
        },
        []
    );

    useEffect(() => {
        // 如果fetch发生变更
        clearTimeout(allRef.current.waitTimeout);
        // 组织组件渲染，以免出现子组件从有数据 -> 无数据 -> 有数据，出现明显的闪动
        allRef.current.freezeUpdate = true;

        // 重置请求状态
        allRef.current.ajaxing = false;
        allRef.current.prevResponseData = {};

        // 需要有一个最大时长限制，如果下一次请求没有返回，也有重新状态
        allRef.current.waitTimeout = setTimeout(() => {
            allRef.current.freezeUpdate = false;
            setState({ items: [] });
        }, mixProps.waitNextReuqestTime);

        const scroller = mixProps.target ? new Scroll($($p.current).parents(mixProps.target)[0]) : scroll;
        request(mixProps, { items: [], isEnd: false });

        allRef.current.removeScroll = scroller.listen(({ direction, distance }) => {
            const pageRoot = getShare('currentPage');
            // 如果distance是字符串/HTMLElement的话，就获取指定元素的位置
            if (mixProps.direction == direction && distance < mixProps.distance) {
                // 只有当前元素显示的时候才执行
                if (pageRoot?.contains($p.current)) {
                    request();
                }
            }
        });
        return allRef.current.removeScroll;
    }, [mixProps.fetchKey]);

    const request = (currentProps, currentState) => {
        currentProps = currentProps || allRef.current.mixProps;
        currentState = currentState || stateRef.current;
        if (allRef.current.ajaxing || currentState.isEnd) {
            return;
        }
        allRef.current.ajaxing = true;

        // 保证key的一致性，那本质是什么？应当属于两个独立的实例？
        const prevKey = currentProps.fetchKey;
        const requestParams = {
            ...currentProps.params,
            ...currentProps.handleParams(allRef.current.prevResponseData || {}),
        };
        getData(currentProps.api, requestParams, (res) => {
            if (prevKey !== allRef.current.mixProps.fetchKey) return;

            clearTimeout(allRef.current.waitTimeout);
            const { code, msg, data } = currentProps.preHandleData(res, requestParams) || res;

            if (code == 0) {
                // 如果数据加载完毕，移除事件监听
                if (data.isEnd) {
                    allRef.current.removeScroll();
                }
                // 服务端返回，下次请求带上
                allRef.current.prevResponseData = data;

                const resItems = data.items || data.list || [];
                const items = currentState.items.concat(resItems);

                setState({ items, isEnd: data.isEnd, requested: true, updateKey: Math.random() + Date.now() });

                currentProps.useApiCache && storage.setItem(currentProps.api, items.slice(0, 30));
                // 服务端如果处理不好，有造成死循环的风险
                // 是否应该有个自动请求的最大上线
                if (!data.isEnd && resItems.length < currentProps.autoRequestNext) {
                    request();
                }
            } else {
                allRef.current.ajaxing = false;
                allRef.current.freezeUpdate = false;
                Modal.fail(msg);
            }
        });
    };

    useEffect(() => {
        allRef.current.ajaxing = false;
        allRef.current.freezeUpdate = false;

        scroll.trigger(); // 触发的应该是图片懒加载
    }, [state.updateKey]);

    const getShowList = () => {
        const { items, isEnd, requested } = state;
        // 是否应当有数据请求后，就应当返回？
        if (requested || isEnd) {
            return items;
        }
        if (mixProps.firstScreenData?.length) {
            return mixProps.firstScreenData;
        }
        if (mixProps.useApiCache) {
            return storage.getItem(mixProps.api) || [];
        }
        return [];
    };

    const { Loading, LoadingMore } = mixProps;
    const { isEnd } = state;
    const showList = getShowList();

    const renderContent = () => {
        const { isEnd, requested } = state;
        const { parent, Template, Empty } = mixProps;

        if (isEnd && showList.length == 0 && Empty) {
            return Empty;
        }

        return <Template isFirstLoading={!requested} items={showList} isEnd={isEnd} parent={parent} />;
    };

    return (
        <div ref={$p} className={mixProps.className} style={mixProps.style}>
            {!isEnd && showList.length === 0 && Loading}
            {renderContent()}
            {!isEnd && showList.length > 0 && LoadingMore}
        </div>
    );
}

export const FetchList = forwardRef(FetchListCore);
