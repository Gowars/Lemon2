import React, { PureComponent } from 'react';
import Sticky from '../Fixed/Sticky';
import { getParent, scroll } from '../util';
import { getProps } from '@/lemon-tools/getProps';
import Touch from '../Touch/core';
import S from './index.module.scss';
import cx from '@/lemon-tools/cx';

const defaultProps = {
    list: [],
    current: 0,
    sticky: true, // 是否吸顶
    isSwipe: true,
    handleClick: () => {},
    selectedColor: '#009688',
    defaultColor: '#000',
    borderWidth: '20px', // full/tiny/100px/1rem etc
    root: '', // 根元素
    touchElement: '', // 监听手势的元素
    usePageTouch: false, // 是否要监听整个页面的手势
};

/**
 * @extends {PureComponent<{defaultProps}, {}>}
 */
export default class Tab extends PureComponent {
    get mixProps() {
        return getProps(this.props, defaultProps);
    }

    state = {
        current: this.mixProps.current,
    };

    componentDidMount() {
        this.mixProps.isSwipe && this.addTouchSwipe();
    }

    componentWillUnmount() {
        this.touch && this.touch.destroy();
    }

    tabRef = React.createRef();

    handleClick = (item) => () => {
        if (this.mixProps.handleClick(item) === false) return;

        this.changeIndex(this.mixProps.list.findIndex((i) => i === item));
    };

    changeIndex = (current) => {
        let saveScrollTop = scroll.top;

        if (this.mixProps.sticky) {
            const $holder = getParent(this.tabRef.current, '.sticky-outer-wrapper').querySelector('.sticky-holder');
            saveScrollTop = Math.min(saveScrollTop, $holder.offsetTop);
        }

        this.setState(
            {
                current,
            },
            () => {
                scroll.top = saveScrollTop;
            }
        );
    };

    mainRef = React.createRef();

    borderRef = React.createRef();

    addTouchSwipe(touchElement = this.mainRef.current) {
        const { borderRef } = this;
        const handleChange = (changeX) => {
            const { current } = this.state;
            const { list } = this.mixProps;

            if (current === 0) {
                changeX = Math.max(0, changeX);
            }
            if (current === list.length - 1) {
                changeX = Math.min(0, changeX);
            }

            return changeX;
        };

        const setX = (X = 0) => {
            X /= this.mixProps.list.length;

            // ios cacl(25% + 0px) 有bug
            let transform = `${this.state.current * 100}%`;
            if (X !== 0) {
                X = X >= 0 ? `+ ${X}px` : `- ${Math.abs(X)}px`;
                transform = `calc(${transform} ${X})`;
            }

            borderRef.current.style.cssText += `;
                transform: translateX(${transform});
            `;
        };

        this.touch = new Touch(touchElement, {
            activeClassName: 'ui-tab-touch-active',
            preventDefault: false,
        })
            .on('changev2', ({ state, event }) => {
                const { change } = state;
                if (state.direction === 'lr') {
                    event.preventDefault();
                    setX(handleChange(-change.x));
                }
            })
            .on('endv2', ({ done, state }) => {
                const { x: changeX } = state.change;
                done();
                if (state.direction === 'lr') {
                    const { current } = this.state;
                    const { list } = this.mixProps;
                    const { x: XV } = state.overAllV;
                    if (changeX < -50 || XV < -200) {
                        this.changeIndex(Math.min(list.length - 1, current + 1));
                    } else if (changeX > 50 || XV > 200) {
                        this.changeIndex(Math.max(0, current - 1));
                    } else {
                        setX();
                    }
                }
            });
    }

    getColor(selected = true) {
        return {
            color: selected ? this.mixProps.selectedColor : this.mixProps.defaultColor,
        };
    }

    renderBorder(text) {
        const { borderWidth } = this.mixProps;
        const className = S[borderWidth] || '';
        const spanStyle = className
            ? null
            : {
                  width: borderWidth,
              };
        const borderStyle = {
            width: `${(1 / this.mixProps.list.length) * 100}%`,
            transform: `translateX(${this.state.current * 100}%)`,
            ...this.getColor(),
        };

        return (
            <div className={[S.border, className].join(' ')} style={borderStyle} ref={this.borderRef}>
                <span style={spanStyle}>{text}</span>
            </div>
        );
    }

    render() {
        const { list, renderMain, sticky } = this.mixProps;
        const { current } = this.state;

        return (
            <div ref={this.mainRef}>
                <Sticky disabled={!sticky}>
                    <div className={S.tab} ref={this.tabRef}>
                        {list.map((item, index) => (
                            <div
                                className={cx(S.item, index === current && S.active)}
                                key={item.title}
                                onClick={this.handleClick(item)}
                                style={this.getColor(index === current)}
                            >
                                {item.title}
                            </div>
                        ))}
                        {this.renderBorder(list[current].title)}
                    </div>
                </Sticky>
                {renderMain && renderMain(list[current])}
                {this.mixProps.children}
            </div>
        );
    }
}
