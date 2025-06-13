import { format } from './format';
import { getTime } from './getTime';

class BetterDay {
    /**
     *Creates an instance of BetterDay.
     * @param {Date} d
     * @memberof BetterDay
     */
    constructor(date) {
        if (date instanceof BetterDay) {
            date = date.date;
        }
        const d = new Date(getTime(date) * 1000);
        d.setMilliseconds(0);

        this.date = d;
    }
    clone() {
        return new BetterDay(this.date);
    }
    offset(num) {
        this.date.setDate(this.date.getDate() + num);
        return this;
    }
    // 一天开始的时间
    start() {
        this.setHMS(0, 0, 0);
        return this;
    }
    format(shape) {
        return format(this.date, shape);
    }
    // 一天结束的时间
    end() {
        this.setHMS(23, 59, 59);
        return this;
    }
    // 设置时分秒
    setHMS(h, m, s) {
        this.date.setHours(h);
        this.date.setMinutes(m);
        this.date.setSeconds(s);
        return this;
    }
    setYMD(y, m, d) {
        this.date.setFullYear(y);
        // Date getMonth返回值从0开始，因此此处需要减一
        this.date.setMonth(m - 1);
        this.date.setDate(d);
        return this;
    }
    /**
     * 返回毫秒时间戳
     * @returns
     */
    getTime() {
        return this.date.getTime();
    }
    /**
     * 返回unix时间戳
     * @returns
     */
    unix() {
        return Math.floor(this.date.getTime() / 1000);
    }
    // 距离当前时间的时间戳
    fromNow() {
        return getTime() - this.unix();
    }
    // 从什么时候开始
    after(time) {
        return this.unix() >= new BetterDay(time).unix();
    }
    // 截止到什么时候
    before(time) {
        return this.unix() <= new BetterDay(time).unix();
    }

    get info() {
        // 0 日 1 - 6 星期1-6
        let day = this.date.getDay();
        let month = this.date.getMonth();
        let year = this.date.getFullYear();
        if (day === 0) {
            day = 7;
        }

        const newD = this.clone();
        newD.date.setMonth(month + 1);
        newD.date.setDate(0);
        const monthDate = newD.date.getDate();

        return {
            dayStart: this.clone().setHMS(this.date.getHours(), 0, 0),
            dayEnd: this.clone().setHMS(this.date.getHours(), 59, 59),
            weekStart: this.clone()
                .offset(1 - day)
                .setHMS(0, 0, 0),
            weekEnd: this.clone()
                .offset(7 - day)
                .setHMS(23, 59, 59),
            monthStart: this.clone()
                .offset(1 - this.date.getDate())
                .setHMS(0, 0, 0),
            monthEnd: this.clone()
                .offset(monthDate - this.date.getDate())
                .setHMS(23, 59, 59),
            dates: monthDate, // 当月天数
            yearStart: this.clone().setYMD(year, 0, 1).setHMS(0, 0, 0),
            yearEnd: this.clone().setYMD(year, 11, 31).setHMS(23, 59, 59),
        };
    }

    /**
     * 判断时间是否在某个时间范围内
     */
    range(start, end) {
        return this.unix() >= day(start).unix() && this.unix() <= day(end).unix();
    }

    /**
     * 返回当week day 1、2、3、4、5、6、7
     * @returns {number}
     */
    weekDay() {
        const d = this.date.getDay();
        if (d == 0) {
            return 7;
        }
        return d;
    }
}

/**
 * 以当前时间为基准，获取几天之前后或者之后的时间戳
 * @param {number} [num=0] 正数为几天之后，负数为几天之前
 * @returns
 */
export function day(date) {
    return new BetterDay(date);
}
