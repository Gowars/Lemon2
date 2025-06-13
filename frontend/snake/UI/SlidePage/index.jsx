import React, { useEffect, useRef } from 'react';
import S from './index.module.scss';
import Swiper from '../Touch/Example/Swiper';
import { useBetterState } from '@/snake/useLib';
import cx from '@/lemon-tools/cx';
import Sticky from '../Fixed/Sticky';
import { getProps } from '@/lemon-tools/getProps';

/**
 * 设计目标
 * 左右可以滑动 通过scroll实现
 * 点击可以自动滚动居中
 */

function animation(callback, { start, end, time = 200 }) {
    const MAX = Math.ceil(time / 16);
    const PER = (end - start) / MAX;
    let now = 1;
    const next = () => {
        requestAnimationFrame(() => {
            callback(start + PER * now);
            now += 1;
            if (now <= MAX) next();
        });
    };
    next();
}

/**
 *
 * @param {HTMLElement} child
 * @param {HTMLElement} root
 */
function getPosition(child, root = document.documentElement) {
    if (!(child instanceof HTMLElement)) {
        return 0;
    }
    return child.getBoundingClientRect().top - root.getBoundingClientRect().top;
}

const defaultProps = {
    list: [],
    current: 0,
    onChange: () => {}, // 切换
    renderItem: undefined,
    renderMain: () => null,
    selectedColor: '#009688',
    defaultColor: '#000',
    borderWidth: '10px',
    rootSelector: '', // 根元素
    touchSelector: '', // 监听元素
    flexWrap: true,
    /** 是否只有切换到tab才渲染 */
    lazyRender: false,
    /** tab是否开启sticky */
    tabSticky: false,
};

/**
 * @param {defaultProps} props
 * @returns
 */
export default function SlidePage(props) {
    const mixProps = getProps(props, defaultProps);
    const { state, stateRef, setState } = useBetterState({
        nowIndex: mixProps.current,
        left: 0,
        width: 0,
    });
    const scrollRef = useRef();
    const borderRef = useRef();
    const bodyRef = useRef();

    const scrollRecord = useRef({});
    const stickyRef = useRef();

    const { renderMain, list } = mixProps;
    const { length: len } = list;

    const animate = (index) => {
        const $scroll = scrollRef.current;
        const { clientWidth, scrollLeft } = $scroll;
        const $allItem = Array.from(scrollRef.current.querySelectorAll(`.${S.item}`) || []);
        const { left, width } = $allItem[index].getBoundingClientRect();

        animation(
            (cc) => {
                $scroll.scrollLeft = cc;
            },
            {
                start: scrollLeft,
                end: scrollLeft + left + width / 2 - clientWidth / 2,
            }
        );
    };

    // 如此可以在useEffect里，方便调用callback
    const moveRef = (X = 0) => {
        const len = mixProps.list.length;
        X = -X;
        if (stateRef.current.nowIndex === 0) {
            X = Math.max(0, X);
        }
        if (stateRef.current.nowIndex === len - 1) {
            X = Math.min(0, X);
        }
        X /= len;
        // ios cacl(25% + 0px) 有bug
        let transform = `${stateRef.current.left}px`;
        if (X !== 0) {
            X = X >= 0 ? `+ ${X}px` : `- ${Math.abs(X)}px`;
            transform = `calc(${transform} ${X})`;
        }
        borderRef.current.style.cssText += `; transform: translateX(${transform}); `;
    };

    // tab切换前记录scroll，并在切换回来后恢复
    const onRecordScroll = () => {
        scrollRecord.current[mixProps.list[stateRef.current.nowIndex].title] = document.documentElement.scrollTop;
    };

    const handleScrollRecover = () => {
        if (!mixProps.tabSticky) {
            return;
        }
        const cache = scrollRecord.current[mixProps.list[stateRef.current.nowIndex].title];
        // 获取到触发sticky的最低scroll值
        const minValue = getPosition(stickyRef.current?.holderRef?.current);
        if (cache !== undefined) {
            document.documentElement.scrollTop = Math.max(cache, minValue);
        } else {
            document.documentElement.scrollTop = minValue;
        }
    };

    const onChangeRef = (newIndex) => {
        if (newIndex == stateRef.current.nowIndex) {
            moveRef(0);
            animate(newIndex);
            return;
        }

        animate(newIndex);
        // 更改scrollLeft
        setState({ nowIndex: newIndex });
        mixProps.onChange && mixProps.onChange(newIndex);
    };

    useEffect(() => {
        // current更新后，顺便更新下border
        const item = scrollRef.current.querySelectorAll(`.${S.item}`)[state.nowIndex];
        const { offsetLeft: left, clientWidth: width } = item;

        setState({
            width,
            left,
        });
    }, [state.nowIndex]);

    const getColor = (select = true) => ({
        color: select ? mixProps.selectedColor : mixProps.defaultColor,
    });

    const renderItem = (item, index) => {
        return mixProps.renderItem ? (
            mixProps.renderItem(item)
        ) : (
            <div
                className={S.item}
                onClick={() => {
                    bodyRef.current.go?.(index - stateRef.current.nowIndex);
                    onChangeRef(index);
                }}
                style={getColor(state.nowIndex === index)}
            >
                {item.title}
            </div>
        );
    };

    // left + width + borderWidth
    const borderStyle = {
        width: `${state.width}px`,
        transform: `translateX(${state.left}px)`,
        ...getColor(),
    };

    return (
        <div>
            <Sticky disabled={!mixProps.tabSticky} ref={stickyRef}>
                <div className={cx(S.hide, mixProps.flexWrap && S.themeWrap)}>
                    <div className={S.scroll} ref={scrollRef}>
                        <div className={S.content}>
                            {list.map(renderItem)}
                            <div
                                className={S.border}
                                style={borderStyle}
                                ref={borderRef}
                                data-current={state.nowIndex}
                                data-len={len}
                            >
                                <span>{list[state.nowIndex].title}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Sticky>
            <Swiper
                list={list}
                ref={bodyRef}
                renderItem={(ele) => <div key={ele.title}>{renderMain(ele)}</div>}
                cacheDOMLen={0}
                style={{ height: 'auto', overflow: 'hidden' }}
                loop={false}
                current={state.nowIndex}
                onBeforeChange={onRecordScroll}
                onChange={handleScrollRecover}
                touch={{
                    enable: true,
                    distance: 100,
                    onChange: (event) => moveRef(event?.state?.change?.x),
                    onEnd: (index) => onChangeRef(index, true),
                }}
            />
            {/* {renderMain(list[current])} */}
        </div>
    );
}
