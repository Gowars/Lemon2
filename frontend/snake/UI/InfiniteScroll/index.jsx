import React, { Component } from 'react';
import { getProps } from '@/lemon-tools/getProps';
import { scroll } from '@/lemon-tools/scroll';


/* 可以无限滚动的列表，解决方案有2种
 * 1: 只渲染一个固定高度的空的div，减少dom的复杂度，但如果有超过10w个空的div，也很恐怖
 * 2: 只渲染可视区域内的组件，采用absolute定位，需要先计算出每个元素的高度，算出父容器的整体高度
 * 当前架构采用的是方案2进行渲染，目前测试下来的用户体验还不错
 * 如何对瀑布流进行支持呢？
 * 对于微博这种会动态更新高度的又如何支持？
 * 任何的action都会动态的获取元素高度，然后设置到父元素上
 * // 可以 div.absolute div.auto
 * absolute得高度从auto上获取
 * 应当使用统一的状态管理，避免子组件持有状态，否则在组件卸载重新渲染的时候，产生抖动
 * */

class RecoderHeight {
    constructor(defaultH) {
        this.defaultH = defaultH;
    }

    state = {};

    get(id) {
        return this.state[id] ?? this.defaultH;
    }

    set = (id, h) => {
        this.state[id] = h;
    };
}

const defaultProps = {
    /** 每个元素中间的分割间距 */
    space: 0,
    /** 数据 */
    data: [],
    /** 渲染数据 */
    renderItem: () => null,
    /** 可以计算每个元素的高度 */
    calcHeight: () => 100,
    /** 默认高度，可以保障元素先渲染，后矫正 */
    defaultItemHeight: 100,
    /** 上下预渲染，保障滚动体验 */
    offsetTop: 600,
    /** 上下预渲染，保障滚动体验 */
    offsetBottom: 1500,
};

/**
 * @extends {React.Component<defaultProps, {}>}
 */
export default class InfiniteScroll extends Component {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    recodeList = new RecoderHeight(this.mixProps.defaultItemHeight);

    // 页面resize的时候，需要做适配
    state = {
        renderList: this.getRenderInfo(0),
    };

    componentDidMount() {
        this.removeScroll = scroll.listen(this.handleScroll);
    }

    componentWillUnmount() {
        this.removeScroll();
    }

    // 此处要做节流吗？大概率是不应该的，因为我们不希望用户在滚动的时候看到空白！
    handleScroll = () => {
        // 根据根元素的top来决定到底渲染哪里，因为根元素在body中的相对位置是不确定的
        // 也没有必要在didMount中进行计算，因为body中其他元素的变化也会影响根元素的位置
        // 而getBoundingClientRect这个api可以很好的解决这个问题)
        this.setState({
            renderList: this.getRenderInfo(-this.refRoot.current.getBoundingClientRect().top),
        });
    };

    getRenderInfo(scrollTop) {
        const { data, offsetTop, offsetBottom } = this.mixProps;
        // 如果高度没有出来的时候，默认渲染，然后根据每个元素的位置进行渲染
        let currentTop = 0;
        const renderList = [];

        // 如果首屏渲染数据非常多，应当提供一个懒加载的包裹层面
        for (let index = 0; index < data.length; index++) {
            const it = data[index];

            if (index > 0) {
                currentTop += this.mixProps.space;
            }

            const eleHeight = this.recodeList.get(it.id);

            // 根据相交算法
            if (currentTop + eleHeight >= scrollTop - offsetTop && currentTop < scrollTop + offsetBottom) {
                renderList.push(it);
            } else if (renderList.length > 0) {
                break;
            }

            it.top = currentTop;
            currentTop += eleHeight;
        }

        return renderList;
    }

    // 获取所有的高度，每次render都需要重新计算，性能待优化
    get totalHeight() {
        return this.mixProps.data.reduce((prev, it) => this.recodeList.get(it.id) + prev, 0);
    }

    refRoot = React.createRef();

    updateH = (id, h) => {
        if (this.recodeList.get(id) == h) {
            return;
        }
        this.recodeList.set(id, h);
        this.handleScroll();
    };

    watchHeight = (/** @type {HTMLElement} */ dom, fn) => {
        // https://caniuse.com/?search=ResizeObserver
        // 兼容性ios>=13.4 android>=5
        // 可能会遇到这个错误，但是可以忽略掉
        // https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
        const resize = new ResizeObserver(() => {
            fn(this.updateH);
        });
        resize.observe(dom);
        fn(this.updateH);
        return () => {
            console.log('销毁');
            resize.unobserve(dom);
            resize.disconnect();
        };
    };

    render() {
        const { renderList } = this.state;

        return (
            <div style={{ height: this.totalHeight, position: 'relative' }} ref={this.refRoot}>
                {renderList.map((i, index) => (
                    <div
                        key={i.id}
                        style={{
                            position: 'absolute',
                            top: i.top,
                            width: '100%',
                        }}
                    >
                        <this.mixProps.renderItem item={i} index={index} watchHeight={this.watchHeight} />
                    </div>
                ))}
            </div>
        );
    }
}
