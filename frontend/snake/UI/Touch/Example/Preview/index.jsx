import React, { PureComponent } from 'react';
import cx from '@/lemon-tools/cx';
import { findParent } from '@/lemon-tools/domUtil';

import Swiper from '../Swiper';
import Pinch from '../../Pinch';

import S from './index.module.scss';
import { Modal } from '@/snake/main';
import { getImageCDNSrc } from '@/src/component/cdnUtil';

function animateDOM($dom, css, option = {}) {
    const { transitionTime = 300, onEnd } = option;
    $dom.style.cssText += `;transition: transform ${transitionTime}ms`;
    $dom.clientHeight;
    $dom.style.cssText += css;
    const timeout = setTimeout(() => {
        $dom.style.cssText += ';transition: none;';
        onEnd && onEnd();
    }, transitionTime + 50);

    return () => clearTimeout(timeout);
}

export default ({ current = '', urls = [], ...otherProps } = {}) => {
    const currentIndex = Math.max(urls.indexOf(current), 0);
    const showedRaw = {};

    class PinchSwiper extends Swiper {
        PULL_CLOSE_DIS = 200;
        // 设置缩放
        setPinch() {
            if ((this.pinch && !this.pinch.destroy) || !this.$current) {
                return;
            }

            this.$appRoot = findParent(this.$dom, (d) => d.classList.contains(S.app));

            this.pinch = new Pinch(
                this.$current.querySelector('.swipe-listen-event') || this.$current,
                this.getScaleTarget(this.$current),
                { maxScale: 3 }
            )
                .on('start', () => {
                    this.resetMax();
                })
                .on('change', (change, state) => {
                    const { list, direction } = this.mixProps;
                    const C = state.direction !== direction ? 0 : this.getChange(change);
                    if (this.isCanMove(change) && list.length == 2) {
                        // 处理只有两个元素，需要根据活动方向动态调整位置
                        this.handleLen2Case(C);
                    }
                    if (state.scale === 1 && state.direction !== direction) {
                        this.$appRoot.style.cssText += `;transform: translate3d(0, ${Math.max(
                            change.y - 50,
                            0
                        )}px, 0);`;
                    } else if (state.scale === 1) {
                        this.$s.style.cssText += this.transform(`${C}px`);
                    }
                })
                .on('end', (change, state) => {
                    const { direction } = this.mixProps;
                    const C = this.getChange(change);
                    if (state.scale === 1 && state.direction === direction && this.isCanMove(change)) {
                        if (C > 70) {
                            // 上一张
                            this.go(-1);
                        } else if (C < -70) {
                            // 下一张
                            this.go(1);
                        } else {
                            // 位置保持不边
                            this.go(0);
                        }
                    }
                    // 处理滑动关闭 页面无缩放，且滑动方向与当前方向不一致
                    if (state.scale === 1 && state.direction !== direction) {
                        if (change.y > this.PULL_CLOSE_DIS) {
                            animateDOM(this.$appRoot, ';transform: translateY(120%); pointer-events: none;', {
                                onEnd: () => {
                                    this.mixProps.close();
                                },
                            });
                        } else if (change.y > 0) {
                            animateDOM(this.$appRoot, ';transform: translateY(0);');
                        }
                    }
                });
            this.touchEvent = this.pinch.touch;
        }

        go(index) {
            if (urls.length < 2) {
                index = 0;
            }
            super.go(index);
        }
    }

    class SwipeItem extends PureComponent {
        state = {
            showRaw: showedRaw[this.props.index] || !this.props.placeholder,
            src: getImageCDNSrc(this.props.raw, { w: 2000 }),
        };

        componentDidMount() {
            this.load(this.state.src);
        }

        componentWillUnmount() {
            this.$img.destroy && this.$img.destroy();
        }

        handleClick = () => {
            showedRaw[this.props.index] = 1;
            this.setState({
                showRaw: true,
            });
            this.load(this.state.src, () => {
                this.$img.$$pinch.updateInfo();
                this.$img.$$pinch.enablePinch();
            });
        };

        load(src, callback) {
            const { $img } = this;
            const $parent = $img.parentElement;
            $img.destroy && $img.destroy();

            $parent.classList.add(S.loading);
            $img.removeAttribute('src');

            $img.src = src;
            $img.originSrc = src;
            $parent.classList.remove(S.top);

            const img = new Image();
            const loaded = () => {
                this.compare(img, $img.parentElement.parentElement) && $img.parentElement.classList.add(S.top);
                $img.destroy && $img.destroy();
                callback && callback();
            };
            $img.destroy = () => {
                img.removeEventListener('load', loaded);
                $parent.classList.remove(S.loading);
                $img.destroy = null;
            };
            img.addEventListener('load', loaded);
            img.src = src;
            if (img.complete || img.width || img.height) {
                loaded();
            }
        }

        /**
         * 比较宽高比例
         * @param {*} $img
         * @param {*} $parent
         * @returns
         * @memberof SwipeItem
         */
        compare($img, $parent) {
            const { naturalHeight: imgHeight, naturalWidth: imgWidth } = $img;
            const { clientHeight: parentHeight, clientWidth: parentWidth } = $parent;

            return (Math.min(parentWidth, imgWidth) / imgWidth) * imgHeight > parentHeight;
        }

        render() {
            return (
                <div className={`swipe-listen-event ${S.bgd}`}>
                    <div className={S.imgWrap}>
                        <img
                            alt=""
                            ref={(d) => {
                                this.$img = d;
                            }}
                            className={`${S.img} scale-target`}
                        />
                    </div>
                    {!this.state.showRaw && (
                        <span className={S.scanRaw} onTouchEnd={this.handleClick}>
                            查看原图
                        </span>
                    )}
                </div>
            );
        }
    }

    function App(props) {
        return (
            <div className={S.app}>
                <div className={cx('modal-close', S.back)}>{'◁'}</div>
                <PinchSwiper
                    style={{ height: '100%', width: '100%' }}
                    list={urls}
                    current={currentIndex}
                    renderItem={(item, index) => <SwipeItem key={item} index={index} raw={item} />}
                    pinch
                    keyEvent
                    {...otherProps}
                    close={props.close}
                    S={S}
                />
            </div>
        );
    }

    // 快捷关闭
    Modal.open(<App />, {
        layer: false,
        animation: false,
        fullScreen: true,
        zIndex: 1001,
        escClose: true,
    });
};

export const RenderPercent = ({ current, list = [] }) => (
    <div className={S.renderBottom}>{`${current + 1}/${list.length}`}</div>
);
