/**
 *创建中间件
 * @export
 * @param {Function} coreFn
 * @returns
 */
export default function createOnion(coreFn) {
    const mds = []; // 所有中间件
    return {
        /**
         *
         *
         * @param {(next: Function, ctx: { url: string, getPageNums: () => number, noRender: boolean, action: string }) => void} mdFn
         * @returns
         */
        use(mdFn) {
            mds.push(mdFn);
            return this;
        },
        run(ctx) {
            const fnWrap = () => coreFn && coreFn(ctx);
            // 前一个值类型为可执行function 也就是next，作为参数传递给下一个函数
            mds.reduceRight((prevValue, item) => () => item(prevValue, ctx), fnWrap)();
            return ctx;
        },
    };
}
