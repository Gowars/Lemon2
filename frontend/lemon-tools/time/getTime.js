// 获取时间戳
export function getTime(str) {
    if (typeof str === 'string') {
        const [YMD, hms = ''] = str.split(/T|\s+/).map((i) => i.trim());
        const now = new Date();

        const [D = now.getDate(), M = now.getMonth() + 1, Y = now.getFullYear()] = YMD.split('-')
            .filter((i) => i.trim())
            .reverse()
            .map((i) => Number(i)); // 年 月 日
        const [h = 0, m = 0, s = 0] = hms
            .split(':')
            .filter((i) => i.trim())
            .map((i) => Number(i));

        const newDate = new Date(Y, M - 1, D, h, m, s);
        newDate.setMilliseconds(0);
        return newDate.getTime() / 1000;
    }

    if (typeof str === 'number') {
        return str;
    }

    if (str instanceof Date) {
        return Math.floor(str.getTime() / 1000);
    }

    return Math.floor(Date.now() / 1000);
}
