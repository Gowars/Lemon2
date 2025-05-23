// 时间同步器
export class Timer {
    startTime = 0;

    // 开始时间
    nowTime = 0;

    // 当前时间
    endTime = 0;

    // 结束时间
    baseTime = 0;

    // 基准时间
    constructor(startTime, endTime, option) {
        this.reset(startTime, endTime);
        this.option = option || {};
    }

    get info() {
        return {
            startTime: this.startTime,
            endTime: this.endTime,
            nowTime: this.nowTime,
            distanceTime: this.endTime - this.nowTime, // 获取倒计时时间
        };
    }

    reset(startTime, endTime) {
        clearInterval(this.interval);
        this.nowTime = this.startTime = startTime;
        this.endTime = endTime;
        this.baseTime = Math.floor(Date.now() / 1000); // 基准时间
        this.interval = setInterval(() => {
            this.nowTime = Math.floor(Date.now() / 1000) - this.baseTime + this.startTime;
            this.option.onChange && this.option.onChange(this.info);
            if (this.nowTime >= this.endTime) {
                this.option.onEnd && this.option.onEnd(this.info);
                this.destroy();
            }
        }, 1000);

        // 立即触发变化
        setTimeout(() => {
            this.option.onChange && this.option.onChange(this.info);
        });
    }

    destroy() {
        clearInterval(this.interval);
    }
}
