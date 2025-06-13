// 计划任务精度为每秒执行一次
export default class Crontab {
    cache = {};

    constructor(intervalTime = 1000) {
        const interval = setInterval(() => {
            const NOW = Date.now();
            Object.values(this.cache).forEach((item) => {
                this.exec(item, NOW);
            });
        }, intervalTime);

        this.destroy = () => window.clearInterval(interval);
    }

    exec = (item, NOW) => {
        try {
            const { fn, time } = item;
            time.now = NOW;
            time.pass = NOW - time.start;
            item.execTimes += 1;
            // 不能因为某个任务报错影响其他
            fn(item);
        } catch (err) {
            // debugger
            console.error(err);
        }
    };

    // 可以指定执行多少次立马销毁，
    append(id, fn, option = {}) {
        const start = Date.now();
        const item = {
            fn,
            option,
            done: () => this.remove(id), // 执行结束
            execTimes: 0, // 执行次数
            // 单位以毫秒计算
            time: {
                start, // 开始时间
                pass: 0, // 过去了多长时间
                now: start, // 当前时间
            },
        };
        this.cache[id] = item;
        // 是否需要立即执行
        if (option.imm) {
            this.exec(item, start);
        }
        return this;
    }

    remove(id) {
        delete this.cache[id];
        return this;
    }
}
