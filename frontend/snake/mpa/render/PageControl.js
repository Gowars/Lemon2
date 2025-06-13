import { os } from '../helper';
import './Page.scss';

function getAniamtion(animationType = '') {
    let type = '';
    if (animationType) {
        type = '-' + animationType;
    }

    // 抽象成配置的好处在于：可以针对不同的系统班，提供不同的动画
    return {
        comeIn: {
            name: 'page-come-in' + type, // 动画类
            // 动画执行时间，比页面动画的实际时间要长一点
            // 避免动画被中途打断，页面执行动画的时候，应当禁止页面一切操作行为
            time: 300,
        },
        comeOut: {
            name: 'page-come-out' + type,
            time: 300,
        },
    };
}

/**
 * safari的toolbar在某些情况下会显示出来
 * 但是window.innerHeight确没有变小，导致fixed元素无法显示！
 */
function fixedSafariToolbar(currentTop) {
    if (currentTop >= 1) return;
    const commonSafari = os.safari && !navigator.standalone;
    // https://stackoverflow.com/questions/4117377/how-do-i-hide-the-address-bar-on-iphone
    // TODO: 新增一个问题，页面会抖动一下 0 -> 1
    // 下拉刷新也不会立刻生效了！
    if (commonSafari) {
        window.scrollTo(0, 1);
        // window.scrollTo(0, 0)
    }
}

function checkAnimation(animation) {
    return !os.pc && animation;
}

class Timer {
    jobs = [];
    // 立即执行模式
    immMode = false;

    // 新增异步任务
    add(fn, time) {
        if (time > 0 && !this.immMode) {
            const item = {
                fn,
                time,
                timer: undefined,
                execed: false,
            };
            this.jobs.push(item);
            item.timer = setTimeout(() => {
                item.execed = true;
                item.fn();
                const index = this.jobs.findIndex((i) => i == item);
                if (index > -1) {
                    this.jobs.splice(index, 1);
                }
            }, time);

            return () => {
                clearTimeout(item.timer);
                item.execed = true;
            };
        }

        fn();
        return () => {};
    }

    // 立即执行模式，执行并清空所有任务
    execAll() {
        this.immMode = true;
        this.jobs.forEach((i) => {
            clearTimeout(i.timer);
        });
        this.jobs.sort((a, b) => a.time - b.time);
        this.jobs.filter((i) => !i.execed).forEach((i) => i.fn());
        this.jobs = [];
        this.immMode = false;
    }

    // 清空所有异步任务
    clear() {
        this.jobs.forEach((i) => {
            clearTimeout(i.timer);
        });
        this.jobs = [];
    }
}

export default class PageControl {
    // 长度缓存
    constructor(option) {
        this.pages = [];
        this.keepaliveList = [];
        this.currentPage = null;
        this.root = option.root; // 根元素
        this.domCacheNum = option.domCacheNum || 5; // 页面缓存个数
        this.timer = new Timer();

        // why?
        // 在页面切换动画执行的时候，有些接口的数据已经返回了，react重新渲染，页面dom结构发生变化，导致动画卡顿
        // 此时可以通过获取动画执行状态，以延迟执行动画
        this.runAnimation = false; // 页面push动画进行中

        this.SCROLL = {
            get top() {
                if (option.scroller) {
                    return option.scroller.scrollTop;
                }
                return document.body.scrollTop || document.documentElement.scrollTop;
            },
            set top(newValue) {
                if (option.scroller) {
                    option.scroller.scrollTop = newValue;
                    return;
                }
                document.body.scrollTop = newValue;
                document.documentElement.scrollTop = newValue;
            },
        };

        this.CONFIG = {
            className: 'root-page',
            hideClassName: 'root-page-hide',
            /**
             * 为什么push行为要特殊一点
             * 因为需要页面先渲染，再执行动画，如果此时页面是none
             * 再页面计算元素高度的时候，问题会比较的多
             **/
            pushHideClassName: 'root-page-hide-push',
            currentClassName: 'root-page-current',
        };
    }

    execAnimation(/** @type {HTMLElement} */ dom, className, time = 0, callback) {
        if (time <= 0) {
            callback(() => {});
            return () => {};
        }
        dom.classList.remove(this.CONFIG.hideClassName);
        dom.classList.add(className);

        // TODO: 支持立即执行，和取消任务，以和timer api兼容
        if (time > 0) {
            // 监听动画执行完毕回调，以精确回调
            const handler = (event) => {
                dom.removeEventListener('animationend', handler);
                if (event.animationName.startsWith('page')) {
                    callback(() => {
                        dom.classList.remove(className);
                    });
                }
                console.log('页面动画已执行', event.animationName);
            };
            dom.addEventListener('animationend', handler);

            return () => {
                dom.removeEventListener('animationend', handler);
            };
        }

        const remove = this.timer.add(() => {
            callback(() => {
                dom.classList.remove(className);
            });
        }, time);

        return remove;
    }

    get lastItem() {
        return this.pages[this.pages.length - 1];
    }

    unmount = (item) => {
        item.onUnmount(item);
        item.dom?.parentElement?.removeChild(item.dom);
    };

    setCurrent(item) {
        this.currentPage = item;
        item.dom.classList.remove(this.CONFIG.hideClassName, this.CONFIG.pushHideClassName);
        item.dom.classList.add(this.CONFIG.currentClassName);

        this.pages.forEach((ele) => ele.dom !== item.dom && this.hideDom(ele.dom));
        this.keepaliveList.forEach((ele) => ele.dom !== item.dom && this.hideDom(ele.dom));
    }

    setPosition(dom, num) {
        dom.style.cssText += `top: ${num}px;`;
    }

    hideDom(dom) {
        dom.classList.add(this.CONFIG.hideClassName);
        dom.classList.remove(this.CONFIG.currentClassName);
    }

    pop(targetId, option) {
        this.timer.execAll();
        // 从尾部向前查找，找到最近一个相近id
        const pagesCopy = [...this.pages];
        const targetPage = pagesCopy.reverse().find((i) => i.id == targetId);
        const index = this.pages.findIndex((i) => i === targetPage);
        // 支持多级返回
        const needUnmoutPages = this.pages.splice(index + 1, this.domCacheNum);

        let { lastItem } = this;
        // 如果修改hash，再返回，因其没有操作state，id没有变化，故而pop事件在dom层面没有任何影响
        // 此时有可能lastItem还存在，但是react不存在了

        if (targetId !== undefined && index < 0) {
            lastItem = this.push(targetId, {
                ...option,
                head: true,
                animation: false,
            });
        }

        let [needAnimationPage] = needUnmoutPages.splice(-1, 1);
        if (!needAnimationPage && this.currentPage?.keepAlive) {
            needAnimationPage = this.currentPage;
        }
        needUnmoutPages.forEach((item) => {
            // 最后一个执行动画 // 隐藏其他元素 // 卸载所有元素
            item.dom.classList.add(this.CONFIG.hideClassName);
            this.unmount(item);
        });
        // 设置为底部元素
        const currentTop = this.SCROLL.top;
        this.setCurrent(lastItem);

        // 执行动画元素
        if (needAnimationPage) {
            this.setPosition(needAnimationPage.dom, -currentTop);
            const { animation = true } = option;
            this.execAnimation(
                needAnimationPage.dom,
                getAniamtion(option.animationType).comeOut.name,
                checkAnimation(animation) ? getAniamtion(option.animationType).comeOut.time : 0,
                (done) => {
                    if (needAnimationPage.keepAlive) {
                        this.setPosition(needAnimationPage.dom, 0);
                        this.hideDom(needAnimationPage.dom);
                        done();
                    } else {
                        this.unmount(needAnimationPage);
                    }
                }
            );
        }

        // 在ios15上如果页面从隐藏切换到显示状态，可能会导致fixed定位渲染异常
        // 具体表现为从不可滚动页面A -> 不可滚动页面B -> 可滚动页面C 快速滚动
        // 回到页面A时，A页面的底部fixed元素渲染到顶部上去了
        // 此处通过强制页面容器渲染计算，保障页面渲染正常。目前测试可以解决以上问题
        if (os.safari && os.phone) {
            lastItem.dom.style.cssText += ';display: none;';
            lastItem.dom.clientHeight;
            lastItem.dom.style.cssText += ';display: block;';
        }
        // 不知为何，在safari上需要异步一下，才能保证scrollTop正常
        this.timer.add(
            () => {
                // 尝试触发一下scroll事件
                this.SCROLL.top = lastItem.scrollTop + 0.1;
                fixedSafariToolbar(this.SCROLL.top);
                // 期望scrollTop修改后再触发onPageShow
                lastItem && lastItem.onPageShow(lastItem);
            },
            os.safari && os.phone ? 10 : 0
        );
    }

    // 在尾部创建新元素
    push(id = Math.random(), option) {
        let { head: insertHead, replace, animation = true, ...others } = option;
        this.timer.execAll();
        let alivePage = this.keepaliveList.find((ele) => {
            return ele.keepAlive === others.keepAlive;
        });

        // 强制render
        if (others.forceRender && alivePage) {
            this.keepaliveList = this.keepaliveList.filter((i) => i == alivePage);
            alivePage = null;
        }

        let page;

        let prevPage;
        if (this.currentPage) {
            prevPage = this.currentPage;
            this.currentPage.scrollTop = this.SCROLL.top;
            this.currentPage.onPageHide(this.currentPage);
        }

        if (alivePage) {
            page = alivePage;
            page.dom.classList.add(this.CONFIG.className, this.CONFIG.pushHideClassName);
            page.onPageShow(page);
        } else {
            const dom = document.createElement('div');
            dom.setAttribute('data-page-id', id);
            dom.classList.add(this.CONFIG.className, this.CONFIG.pushHideClassName);

            page = {
                id,
                dom,
                scrollTop: 0,
                onPageHide: () => {},
                onPageShow: () => {},
                onRender: () => {},
                onUnmount: () => {},
                ...others,
            };

            // 添加到头部还是尾部
            if (insertHead && this.root.firstElementChild) {
                this.root.insertBefore(dom, this.root.firstElementChild);
            } else {
                this.root.appendChild(dom);
            }

            if (page.keepAlive) {
                this.keepaliveList.push(page);
            } else {
                this.pages.push(page);
            }
            // 先执行渲染，后执行动画，一定程度上可以保证动画的流畅执行
            page.onRender(page);
        }

        this.runAnimation = true;

        const time = checkAnimation(animation) ? getAniamtion(option.animationType).comeIn.time : 0;
        this.execAnimation(page.dom, getAniamtion(option.animationType).comeIn.name, time, (done) => {
            this.setCurrent(page);
            if (alivePage) {
                this.SCROLL.top = alivePage.scrollTop;
            } else {
                this.SCROLL.top = 0;
            }
            fixedSafariToolbar(this.SCROLL.top);
            this.runAnimation = false;

            // 之所以有闪动是因为scrollTop由一个很大的值变为0的时候会造成页面flush
            // 解决方案：延长push过来页面的fixed布局的时间，可以遮挡页面的抖动
            this.timer.add(() => {
                done && done();
                if (alivePage) {
                    this.SCROLL.top = alivePage.scrollTop;
                } else {
                    this.SCROLL.top = 0;
                    // fixedSafariToolbar()
                }
                // 触发滚动事件，以解决业务层懒加载不触发的问题
                // 因为懒加载组件会在组件实例化的时候执行一次，而实例化的时候页面可能处在隐藏状态
                // 因此在页面真正显示的时候，需要触发一次scroll事件
                window.dispatchEvent(new Event('scroll'));
            }, 200);

            if (replace) {
                // 对于多Tab页面切换，希望能够保留页面的状态
                // 需要我们在页面切换之后，保留前一个dom，等到下一次replace的时候，恢复其dom
                // 1 2 3 3-1 3-2 4 按照这种根部元素
                // this.pages.splice(-2, 1).forEach(this.unmount);
                [prevPage].filter((i) => i && !i.keepAlive).forEach(this.unmount);
            } else {
                this.recovery();
            }
        });

        return page;
    }

    recovery() {
        // 从数组头部开始，移除超出最大长度的元素
        this.pages.splice(0, this.pages.length - this.domCacheNum).forEach(this.unmount);
    }
}
