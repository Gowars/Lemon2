export default class Crontab {
    /**
     * Creates an instance of Crontab.
     * @param {number} [intervalTime=1000]
     * @memberof Crontab
     */
    constructor(intervalTime: number = 1000);
    /**
     * 添加计划任务
     * @param {string} key
     * @param {({ execTimes: number, time: { start: number, end: number, pass: number } }) => void} fn
     * @param {{ imm: boolean }} option
     * @returns {Crontab}
     * @memberof Crontab
     */
    append(
        key: string,
        fn: ({ execTimes: number, time: { start: number, end: number, pass: number } }) => void,
        option: { imm: boolean }
    ): Crontab;
    /**
     * 移除计划任务
     * @param {string} key
     * @returns {Crontab}
     * @memberof Crontab
     */
    remove(key: string): Crontab;
    /**
     * 销毁
     * @memberof Crontab
     */
    destroy();
}
