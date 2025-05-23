import Touch from '../../core';
import './index.module.scss';

const platform = navigator.platform.toLowerCase();
const userAgent = navigator.userAgent.toLowerCase();
const isIOS = platform.match(/iphone|ipad/) && userAgent.match(/iphone|ipad/);

class Animation {
    fps = 60;

    animationTime = 0.3;

    type = 'linear';

    constructor(type = 'linear', fps = 60) {
        this.type = type;
        this.fps = fps;
    }

    start(start, target, callback) {
        const MAX = this.animationTime * this.fps;
        const PER = (target - start) / MAX;
        let i = 1;
        let raf;
        const update = () => {
            if (i > MAX) {
                return;
            }
            raf = requestAnimationFrame(() => {
                callback(start + PER * i);
                i += 1;
                update();
            });
        };

        update();

        this.done = () => {
            cancelAnimationFrame(raf);
            callback(target);
        };
    }
}

class Hhh {
    currentItemIndex = 0; // 当前处在哪个元素上

    itemHeight = 30; // 单个元素高度

    circleMaxItem = 20; // 一个圆周上有多少个元素

    $dom = document.body;

    source = [];

    constructor($container, source = Array.from({ length: 100 })) {
        this.$container = $container;
        this.$rotateItemWrap = $container.querySelector('.rotate-item-wrap');
        this.$rotateContainer = $container.querySelector('.rotate-container');
        const perspective = this.itemHeight / 2 / Math.tan(Math.PI / this.circleMaxItem);
        this.source = source;
        this.PER = 360 / this.circleMaxItem;

        // 是不是IOS真实设备
        if (!isIOS) {
            this.$rotateItemWrap.style.cssText += `
                transform-origin: center center -${perspective}px;
            `;
        }
        this.$rotateItemWrap.innerHTML = source
            .map(
                (_, i) => `
            <div class="rotate-item" style="
                transform: rotateX(-${i * this.PER}deg);
                transform-origin: center center -${perspective}px;
            ">201${i}</div>
        `
            )
            .join('');

        this.$rotateItems = Array.from(this.$container.querySelectorAll('.rotate-item') || []);

        this.handleChange(this.currentItemIndex);
        this.addEvents();
    }

    animationTo(rotateX, direction) {
        this.$rotateItemWrap.style.cssText += `
            transition: none;
        `;
        this.$rotateItemWrap.clientHeight;
        const { PER, source } = this;

        if (direction == 'toUp') {
            if (Math.abs(rotateX % PER) > PER / 3) {
                rotateX = Math.floor(rotateX / PER) * PER + PER;
            } else {
                rotateX = Math.floor(rotateX / PER) * PER;
            }
        }

        if (direction == 'toDown') {
            if (Math.abs(rotateX % PER) > (PER / 3) * 2) {
                rotateX = Math.floor(rotateX / PER) * PER - PER;
            } else {
                rotateX = Math.floor(rotateX / PER) * PER;
            }
        }

        rotateX = Math.min(PER * (source.length - 1), Math.max(0, rotateX));

        this.handleChange(Math.round(rotateX / PER));

        this.animation(rotateX, 0.3);

        return rotateX;
    }

    animation(rotateX) {
        const { currentRotateX } = this;

        new Animation().start(currentRotateX, rotateX, (deg) => {
            this.$rotateItemWrap.style.cssText += `
                transform: perspective(1000px) rotateX(${deg}deg);
            `;
            // 更新rotateX后，去更新dom元素的可见度，然后可以做到无限滚动
            this.handleRotateChange(deg);
        });
    }

    handleRotateChange(cr) {
        this.handleChange(Math.floor(cr / this.PER));
    }

    handleChange(currentIndex) {
        this.$rotateItems.forEach((ele, index) => {
            if (index === currentIndex) {
                ele.classList.add('current');
            } else {
                ele.classList.remove('current');
            }
            if (Math.abs(index - currentIndex) < this.circleMaxItem - 3) {
                ele.classList.add('visible');
            } else {
                ele.classList.remove('visible');
            }
        });
    }

    currentRotateX = 0;

    addEvents() {
        const { PER } = this;
        let rotateX = 0;

        new Touch(this.$container, {
            XYWeight: 0,
        })
            .on('changev2', ({ state }) => {
                const { change } = state;
                this.currentRotateX = rotateX - (change.y / 60) * PER;
                this.$rotateItemWrap.style.cssText += `;transform: perspective(1000px) rotateY(0deg) rotateX(${this.currentRotateX}deg);`;
                this.handleRotateChange(this.currentRotateX);
            })
            .on('endv2', ({ done, state }) => {
                const { change } = state;
                if (state.V.y !== 0) {
                    const currentRotateX = rotateX - ((change.y + state.V.y * 100000) / 60) * PER;
                    rotateX = this.animationTo(currentRotateX, change.y > 0 ? 'toDown' : 'toUp');
                    done();
                }
            });
    }
}

const div = document.createElement('div');
div.innerHTML = `
    <div class="swipeItem" style="overflow: hidden; background: burlywood; position: absolute; top: 0; width: 100%;">
        <div class="rotate-container">
            <div class="rotate-item-wrap"></div>
        </div>
    </div>
`;
document.body.appendChild(div);

new Hhh(document.querySelector('.swipeItem'));
