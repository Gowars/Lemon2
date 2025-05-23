import { day } from './day';
import { format, formatDown, formatDuration } from './format';
import { fromNow } from './fromNow';
import { getTime } from './getTime';

export { format, formatDown, day, getTime, fromNow, formatDuration };

export function unixNowTime() {
    return Math.floor(Date.now() / 1000);
}

const time = {
    format, formatDown, day, getTime, fromNow, formatDuration, unixNowTime
}

export default time

export const SEC = 1;
// 分
export const MIN = 60;
// 小时
export const HOUR = 60 * 60;
// 天
export const DAY = 60 * 60 * 24;
// 月
export const MOUTH = 60 * 60 * 24 * 30;
// 年
export const YEAR = 60 * 60 * 24 * 365;
