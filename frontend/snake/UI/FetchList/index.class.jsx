import { http } from '@/lemon-tools/ajax';
import { Scroll } from '@/lemon-tools/scroll';
import { storage } from '@/lemon-tools/storage';
import React, { Component } from 'react';
import { getShare } from '@/snake/main/share';
import Modal from '../Modal';
import $ from '@/lemon-tools/$';

/**
 * 滚动加载
 * Provider: 默认为window，也可以为其他dom元素
 * direction: tb|lf 默认为上下加载
 * maxDistance: 会触发回调的最大距离 px|rem|vh都支持
 */

function getData(url = '', params = {}, callback) {
    http(url, {
        body: params,
    }).then((res) => callback(res));
}

const LOADING_STYLE = {
    lineHeight: '60px',
    textAlign: 'center',
};

const EMPTY = <div style={{ paddingTop: '40px', textAlign: 'center' }}>没有查询到相关数据</div>;

const LOADING = <div style={LOADING_STYLE}>数据加载···</div>;

const LOADING_MORE = <div style={LOADING_STYLE}>加载更多···</div>;

export default class Pagination extends Component {
    static defaultProps = {
        firstScreenData: [], // 首屏数据
        direction: 'down', // 左右滚动还是上下滚动
        distance: 2000, // 距离还有多少的时候触发数据加载
        api: '', // 接口地址
        params: {}, // 参数
        preHandleData: (any) => any, // 数据预处理
        handleParams: (any) => ({ page: any.page || '' }), // 根据上次请求结果提供新的params
        autoRequestNext: 0, // 如果本页数据小于此值，且没有加载完毕，自动请求下一页数据
        target: null, // 滚动监听对象
        Loading: LOADING, // 第一次加载loading
        LoadingMore: LOADING_MORE, // 加载更多的loading
        Empty: EMPTY, // 空数据占位
        Template: () => {},
        parent: {}, // 父组件传递给子组件的信息
        fetchKey: '',
        useApiCache: false,
        waitNextReuqestTime: 500,
    };

    state = {
        items: [], // 列表数据
        isEnd: false, // 分页请求是否结束
        requested: false, // 标识一下是否进行过请求了
    };

    componentDidMount() {
        this.scroll = this.props.target ? new Scroll($(this.$p).parents(this.props.target)[0]) : scroll;
        this.listenScroll();
        this.request();
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        // 如果fetch发生变更
        if (nextProps.fetchKey !== this.props.fetchKey) {
            clearTimeout(this.waitTimeout);
            // 组织组件渲染，以免出现子组件从有数据 -> 无数据 -> 有数据，出现明显的闪动
            this.freezeUpdate = true;

            // 重置请求状态
            this.ajaxing = false;
            this.prevResponseData = {};

            // 立马开始下一次的请求
            this.listenScroll();
            this.request(nextProps, { items: [], isEnd: false });
            // 需要有一个最大时长限制，如果下一次请求没有返回，也有重新状态
            this.waitTimeout = setTimeout(() => {
                this.freezeUpdate = false;
                this.setState({ items: [] });
            }, this.props.waitNextReuqestTime);
        }
    }

    shouldComponentUpdate() {
        return !this.freezeUpdate;
    }

    componentWillUnmount() {
        this.removeScroll();
    }

    listenScroll() {
        const { props } = this;
        this.removeScroll();

        this.removeScrollHandler = this.scroll.listen(({ direction, distance }) => {
            const pageRoot = getShare('currentPage');
            // 如果distance是字符串/HTMLElement的话，就获取指定元素的位置
            if (props.direction == direction && distance < props.distance) {
                // 只有当前元素显示的时候才执行
                if (pageRoot?.contains(this.$p)) {
                    this.request();
                }
            }
        });
    }

    removeScroll() {
        this.removeScrollHandler && this.removeScrollHandler();
    }

    // 提供一个停止请求的方法
    request = (props = this.props, currentState = this.state) => {
        if (this.ajaxing || currentState.isEnd) {
            return;
        }
        this.ajaxing = true;

        // 保证key的一致性，那本质是什么？应当属于两个独立的实例？
        const prevKey = props.fetchKey;
        const requestParams = {
            ...props.params,
            ...props.handleParams(this.prevResponseData || {}),
        };
        getData(props.api, requestParams, (res) => {
            if (prevKey !== this.props.fetchKey) return;

            clearTimeout(this.waitTimeout);
            const { code, msg, data } = props.preHandleData(res, requestParams) || res;

            if (code == 0) {
                // 如果数据加载完毕，移除事件监听
                data.isEnd && this.removeScroll();
                // 服务端返回，下次请求带上
                this.prevResponseData = data;

                const resItems = data.items || data.list || [];
                const items = currentState.items.concat(resItems);

                this.setState({ items, isEnd: data.isEnd, requested: true }, () => {
                    this.ajaxing = false;
                    this.freezeUpdate = false;

                    scroll.trigger(); // 触发的应该是图片懒加载
                    props.useApiCache && storage.setItem(props.api, items.slice(0, 30));

                    // 服务端如果处理不好，有造成死循环的风险
                    // 是否应该有个自动请求的最大上线
                    if (!data.isEnd && resItems.length < props.autoRequestNext) {
                        this.request();
                    }
                });
            } else {
                this.ajaxing = false;
                this.freezeUpdate = false;
                Modal.tips(msg);
            }
        });
    };

    get showList() {
        const { items, isEnd, requested } = this.state;
        // 是否应当有数据请求后，就应当返回？
        if (requested || isEnd) {
            return items;
        }
        if (this.props.firstScreenData?.length) {
            return this.props.firstScreenData;
        }
        if (this.props.useApiCache) {
            return storage.getItem(this.props.api) || [];
        }
        return [];
    }

    renderContent() {
        const { isEnd, requested } = this.state;
        const { parent, Template, Empty } = this.props;

        if (isEnd && this.showList.length == 0 && Empty) {
            return Empty;
        }

        return <Template isFirstLoading={!requested} items={this.showList} isEnd={isEnd} parent={parent} />;
    }

    render() {
        const { Loading, LoadingMore } = this.props;
        const { isEnd } = this.state;

        return (
            <div
                ref={(d) => {
                    this.$p = d;
                }}
            >
                {!isEnd && this.showList.length === 0 && Loading}
                {this.renderContent()}
                {!isEnd && this.showList.length > 0 && LoadingMore}
            </div>
        );
    }
}
