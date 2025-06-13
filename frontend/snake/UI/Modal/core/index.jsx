import React, { Component, useEffect, useRef, forwardRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './index.scss';
import cx from '@/lemon-tools/cx';
import HotKey from '@/lemon-tools/hotkeys';
import { modalRecord } from '../modalRecord';
import { watchWindowSize } from '@/lemon-tools/watchWindowSize';
import { StopScroll } from '@/lemon-tools/scroll/stopScroll';

const MODAL_CLOSE_CLASS = 'modal-close';
let cache = [];

class ModalWarp extends Component {
    static defaultProps = {
        animation: true, // 是否执行动画
        animationTime: 0.3,
        animationType: 'ud', // 动画类型
        layer: true, // 是否显示layer
        layerClose: true, // 点击layer关闭弹窗
        fullScreen: false, // 是否全屏
        zIndex: 1000,
        children: '',
        position: 'center',
        isStatic: false,
        isStopBodyScroll: true,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.children !== prevState.children) {
            return {
                children: nextProps.children,
            };
        }

        return null;
    }

    constructor(props) {
        super(props);
        // 所有props托管到state，以供更新
        this.state = {
            enter: true,
            leave: false,
            ...props,
        };
    }

    afterMount () {
        if (this.props.animation) {
            document.body.clientHeight;
            this.setState({
                enter: false,
            });
        }
    }
    beforeUnmount () {
        if (this.props.animation) {
            document.body.clientHeight;
            this.setState({
                leave: true,
            });
        }
    }

    componentDidMount() {
        // 事件代理
        this.$parent.addEventListener('click', this.handleClickEvent);
        // 提升关闭弹窗灵敏性
        this.$parent.addEventListener('touchend', this.handleTouchEvent);
        if (this.props.isStopBodyScroll) {
            this.stopScroll = new StopScroll([this.$layer, this.$content]).on();
        }
    }

    componentWillUnmount() {
        this.stopScroll && this.stopScroll.off();
    }

    handleTouchEvent = (event) => {
        let $ele = event.target;
        while ($ele !== event.currentTarget) {
            if ($ele.classList.contains(MODAL_CLOSE_CLASS)) {
                setTimeout(this.unmount, 50);
                break;
            } else {
                $ele = $ele.parentElement;
            }
        }
    };

    handleClickEvent = (event) => {
        let $ele = event.target;
        while ($ele !== event.currentTarget) {
            if ($ele.classList.contains(MODAL_CLOSE_CLASS)) {
                this.unmount();
                break;
            } else {
                $ele = $ele.parentElement;
            }
        }
    };

    updateState = (children, props = {}) => {
        this.setState({
            children,
            ...props,
        });
    };

    // 组件卸载前执行
    unmount = () => {
        if (this.isUnmount) return;
        this.isUnmount = true;
        this.props.close();
        const { props = {} } = this.state.children;
        props.onClose && props.onClose();
    };

    handleLayerClick = () => {
        this.state.layerClose && this.unmount();
    };

    render() {
        const { state } = this;
        const { children } = state;

        // classname
        const CLASS = cx({
            ['modal-enter']: state.enter,
            ['modal-leave']: state.leave,
            ['modal-static']: state.isStatic,
            [`modal-animation-type-${state.animationType}`]: !state.isStatic && state.animation, // 动画效果
            ['modal-wrap']: true,
            [`modal-${state.position}`]: true,
        });

        const style = {
            transitionDuration: `${state.animationTime}s`,
        };

        // 复制一个自定义子组件（非普通标签），并为其注入close方法
        let Child = null;
        if (React.isValidElement(children) && typeof children.type !== 'string') {
            Child = React.cloneElement(children, { ...children.props, close: this.unmount }, children.props.children);
        } else if (typeof children === 'string') {
            // 支持html字符串
            Child = <div style={{ height: '100%' }} dangerouslySetInnerHTML={{ __html: children }} />;
        }

        return (
            <ModalView
                className={CLASS}
                ref={(d) => {
                    this.$parent = d;
                }}
                style={{ zIndex: state.zIndex }}
            >
                {state.layer && (
                    <div
                        ref={(d) => {
                            this.$layer = d;
                        }}
                        className="modal-layer"
                        onClick={this.handleLayerClick}
                        style={style}
                    />
                )}
                <div
                    className={cx(
                        `modal-${state.position}-content`,
                        state.fullScreen && 'modal-fullScreen', // 全屏
                        this.props.class?.content
                    )}
                    style={style}
                    ref={(d) => {
                        this.$content = d;
                    }}
                >
                    {Child || children}
                </div>
            </ModalView>
        );
    }
}

function useWindowSize() {
    const [state, setState] = useState(watchWindowSize.get());
    useEffect(() => {
        return watchWindowSize.watch((size) => {
            setState(size);
        });
    }, []);
    return [state];
}

const ModalView = forwardRef(function WrapView(props, ref) {
    const [size] = useWindowSize();

    return (
        <div
            className={props.className}
            ref={ref}
            style={{
                ...props.style,
                width: size.width,
                height: size.height,
            }}
        >
            {props.children}
        </div>
    );
});

// children
export class ModalContainer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            list: [],
        };

        const { dom } = props;
        dom.addChildModal = (item) => {
            item.close = (animation, { from } = {}) => {
                animation = animation ?? item.options.animation ?? true;
                // 校验是否可以关闭，可以添加一个屏蔽close, closeAll的配置
                if (item.options?.beforeClose?.(from)) {
                    return;
                }

                // 执行卸载动画
                if (item.$reactModalWarp) {
                    item.$reactModalWarp.beforeUnmount();
                    item.options.onClose && item.options.onClose();
                }

                // 把timeout挂载在容器下面，方便下次清除
                setTimeout(
                    () => {
                        this.setState((prevState) => ({
                            list: prevState.list.filter((i) => i.key !== item.key),
                        }));
                    },
                    animation ? (item.animationTime || 0.3) * 1000 : 0
                );
            };

            item.updateState = (Child) => {
                this.setState((prevState) => ({
                    list: prevState.list.map((i) => {
                        if (i === item) {
                            return {
                                ...item,
                                Child,
                            };
                        }
                        return i;
                    }),
                }));
            };

            this.setState(
                (preState) => ({
                    list: [...preState.list, item],
                }),
                () => {
                    item.options.onShow && item.options.onShow(document.querySelector(`#${item.key}`), item.close);
                }
            );

            return item;
        };
    }

    render() {
        return this.state.list.map((item) => (
            <div id={item.key} key={item.key}>
                <item.Comp {...item} close={item.close} />
            </div>
        ));
    }
}

/**
 * 创建全局弹窗，避免弹窗被页面切换时自动关闭
 * @returns
 */
function addGlobalModalContainer() {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(<ModalContainer dom={div} />);
    return div;
}

const globalModalContainer = addGlobalModalContainer();

/**
 * 打开弹窗
 * @param {*} Child
 * @param {*} options
 * @returns
 */
function open(Child, options = {}) {
    const contianer = globalModalContainer;

    const item = {
        Child,
        key: `modal-${Math.random()}`.replace(/\./g, ''),
        options,
        globalModal: options.globalModal, // 支持全局弹窗
        Comp: (props) => {
            const modalRef = useRef();
            useEffect(() => {
                modalRef.current.afterMount(); // 执行创建完毕函数
                item.$reactModalWarp = modalRef.current;
                modalRecord.push(item.key);
                // 显示回调
                return () => {
                    modalRecord.pop();
                    cache = cache.filter((i) => i.key === item.key);
                };
            }, []);

            return (
                <ModalWarp ref={modalRef} {...options} {...props}>
                    {props.Child}
                </ModalWarp>
            );
        },
        onClose: options.onClose,
        beforeClose() {
            // if (from.includes('close')) {
            //     return true;
            // }
            hotKey?.unmount();
            return false;
        },
    };
    cache.push(item);

    const modal = contianer.addChildModal(item);

    if (options.autoClose > 0) {
        setTimeout(() => {
            modal.close();
        }, options.autoClose);
    }

    let hotKey;
    if (options.escClose) {
        hotKey = new HotKey().on('esc', () => {
            if (modalRecord.check(item.key)) {
                modal.close();
                options.onEscClose && options.onEscClose();
            }
        });
    }

    return modal;
}

/**
 * [closeAll 关闭所有弹窗]
 * @method closeAll
 * @return {[type]} [description]
 */
function closeAll(useAnimation = true) {
    [...cache].forEach((item) => {
        // 不可以关闭全局弹窗
        !item.globalModal && item.close(useAnimation, { from: 'closeAll' });
    });
}

/**
 * [close 关闭指定弹窗，如果参数缺省，关闭当前弹窗]
 * @method close
 * @param  {...Transition} id [关闭指定弹窗]
 */
function close(useAnimation = true, ...ids) {
    if (ids.length) {
        ids.forEach((id) => {
            cache.includes(id) && id.close(useAnimation);
        });
    } else {
        // 关闭当前
        const item = cache.slice(-1)[0];
        item && item.close(useAnimation, { from: 'close' });
    }
}

export default {
    open,
    close,
    closeAll,
    MODAL_CLOSE_CLASS,
};
export { open, close, closeAll, MODAL_CLOSE_CLASS };
