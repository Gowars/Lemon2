/**
 * [stylesToStr description]
 * @method stylesToStr
 * @param  {Object|String}         [description]
 * @return {String}                [description]
 */
function stylesToStr(styles = {}) {
    // 驼峰转key-key
    return Object.keys(styles)
        .map((key) => {
            const newKey = key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
            console.log(key, '-', newKey);
            const value = styles[key];
            return `${newKey} : ${value}`;
        })
        .join(';');
}

/**
 * [animation 链式动画调用]
 * @param  {Dom} ele [元素]
 * @return {Animation}     [description]
 */
export default function animation(ele, styles = {}) {
    const cache = [];
    let timeout = null;
    let index = 0;

    // 初始化样式
    ele.style.cssText += `;${stylesToStr(styles)};`;

    function next() {
        // 执行完毕
        if (index == cache.length) {
            return;
        }

        const { type, data } = cache[index++];

        // 样式变化
        if (type == 'STYLE') {
            const { styles, time, callback } = data;
            // 获取properties，将驼峰形式转为key-key形式
            const properties = Object.keys(styles)
                .map((key) => key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`))
                .join(',');
            const transitionTime = `${time / 1000}s`;

            ele.style.cssText += `;transition : ${transitionTime}; transition-origin: center; transition-properties: ${properties};`;
            ele.clientWidth;

            ele.style.cssText += `;${stylesToStr(styles)}`;

            const transitionend = () => {
                ele.removeEventListener('transitionend', transitionend);
                // ele.style.cssText += `;transition: inherit;`
                callback && callback();
                next();
            };

            ele.addEventListener('transitionend', transitionend);
        }

        // 延迟时间
        if (type == 'DELAY') {
            const { time } = data;
            time
                ? setTimeout(() => {
                      console.log('延时结束');
                      next();
                  }, time)
                : next();
        }
    }

    return {
        // 修改css
        css(styles = {}, time = 0, callback) {
            cache.push({
                type: 'STYLE',
                data: {
                    styles,
                    time,
                    callback,
                },
            });

            clearTimeout(timeout);
            timeout = setTimeout(() => {
                next();
            }, 0);

            return this;
        },
        // 延迟执行
        delay(time = 0) {
            cache.push({
                type: 'DELAY',
                data: {
                    time,
                },
            });

            return this;
        },
    };
}

/**
 *
 */
function Animation(start = 0, end = 0, duration = 0.3, type = 'linear', callback) {
    const VAR = Math.abs(end - start) / duration / 60;

    if (start == end) {
        return;
    }

    const startBiggerEnd = start > end;

    animation();

    function animation() {
        if (startBiggerEnd) {
            start -= VAR;
            requestAnimationFrame(() => {
                callback(start);
                if (end <= start) {
                    animation();
                }
                // 是否终结
            });
        } else {
            start += VAR;
            requestAnimationFrame(() => {
                callback(start);
                // 是否终结
                if (end >= start) {
                    animation();
                }
            });
        }
    }
}

class CssAnimation {
    queue = [];

    constructor(dom) {
        this.$dom = dom;
    }

    exec() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(this.execImm);
        return this;
    }

    execImm = () => {
        // 执行动画 callback 等
        const next = () => {
            if (this.queue.length < 1) {
                return;
            }

            const item = this.queue.unshift();
            if (item.type == 'sleep') {
                setTimeout(next, item.time);
                return;
            }

            if (item.type == 'css') {
            }
        };
    };

    // 执行动画
    css(style, time, callback, Bezier) {
        this.queue.push({
            type: 'css',
            style,
            time,
            callback,
        });
        return this.exec();
    }

    // 延迟多久
    sleep(time) {
        this.queue.push({
            type: 'sleep',
            time,
        });
        return this.exec();
    }
}

function ca(dom) {
    return new CssAnimation(dom);
}

ca();
