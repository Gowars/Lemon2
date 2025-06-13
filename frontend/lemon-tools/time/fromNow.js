/**
 * 从过去到现在的时间
 * setTimeout调用 60之内time为1s，一分钟之前time改为1min，依次类推
 * @param {number} time
 */
export function fromNow(time = 0) {
    if (time instanceof Date) {
        time = time.getTime();
    }
    const nowTime = Date.now();
    const sec = (nowTime - time) / 1000;
    // 秒
    if (sec < 60) {
        return `${sec}秒之前`;
    }

    // 分
    const min = Math.floor(sec / 60);
    if (min < 60) {
        return `${min}分钟之前`;
    }

    // 小时
    const hour = Math.floor(min / 24);
    if (hour < 24) {
        return `${hour}小时之前`;
    }

    // 天
    const day = Math.floor(hour / 24);
    if (day < 30) {
        return `${day}天之前`;
    }

    // 月
    const month = Math.floor(day / 30);
    if (month < 12) {
        return `${month}月之前`;
    }

    // 月
    const year = Math.floor(month / 12);
    if (year < 12) {
        return `${year}年之前`;
    }
    return '';
}
