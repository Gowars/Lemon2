function replaceTime(fmt, INFO) {
    const fillzero = (i, len = 2) => `${'0'.repeat(Math.max(len - i.length, 0))}${i}`;
    // 替换数据
    return fmt.replace(/(y|Y){1,4}|M{1,2}|(d|D){1,2}|h{1,2}|m{1,2}|s{1,2}/g, (str) => {
        const key = str[0];
        const v = String(INFO[key]);

        if (!/y/i.test(key)) {
            // 不是年的时候如果只是单一的 MDhms的话，返回的是小于10前面不补0的数据
            if (str.length === 1) {
                return v;
            }
            return fillzero(v);
        }

        return v.slice(-str.length);
    });
}

function toDate(time) {
    return time instanceof Date ? time : new Date(+time);
}

/**
 * 时间格式化
 * @param {string} [fmt='YYYY-MM-DD hh:mm:ss']
 * @param {any} [time=new Date()]
 * @returns
 */
export function format(time = new Date(), fmt = 'YY-MM-DD hh:mm:ss') {
    const D = toDate(time);
    const [y, M, d, h, m, s] = [
        D.getFullYear(),
        D.getMonth() + 1,
        D.getDate(),
        D.getHours(),
        D.getMinutes(),
        D.getSeconds(),
    ].map((i) => `${i}`);

    return replaceTime(fmt, {
        y,
        Y: y,
        M,
        d,
        D: d,
        h,
        m,
        s,
    });
}

/**
 * 有的时候，我们不想展示当前年信息
 * @param {*} time
 * @param {string} fmt
 * @returns
 */
export function formatNoYear(time, fmt, noYearFmt) {
    const d = toDate(time);
    const n = new Date();
    if (d.getFullYear() == n.getFullYear()) {
        return format(time, noYearFmt);
    }
    return format(time, fmt);
}

// 倒计时
export function formatDown(CountdownTime, fmt = 'YYYY-MM-DD hh:mm:ss', reduce = [60, 60, 24, 30, 12, 1]) {
    const [s, m, h, d, M, y] = reduce.map((PER) => {
        const result = CountdownTime % PER;
        // 得到更高位的值
        CountdownTime = Math.floor(CountdownTime / PER);
        return result;
    });

    return replaceTime(fmt, {
        y,
        Y: y,
        M,
        d,
        D: d,
        h,
        m,
        s,
    });
}

/**
 * 如果i小于10则为其添加前缀0
 * 例如: 9 -> 09
 * @param {number} i
 * @returns
 */
export function fill0(i) {
    return Number(i) > 9 ? i : `0${i}`;
}

/**
 * 格式换长度为时:分:秒
 * @param {number} time
 * @returns
 */
export function formatDuration(time = 0) {
    const s = time % 60;
    let m = Math.floor(time / 60);
    if (m >= 60) {
        const h = Math.floor(m / 60);
        m = m % 60;
        return [h, m, s].map(fill0).join(':');
    }

    return [m, s].map(fill0).join(':');
}
