export function createOnion(coreFn) {
    const mds = []; // 所有中间件
    return {
        add(mdFn) {
            mds.push(mdFn);
            return this;
        },
        run(ctx) {
            const fnWrap = () => coreFn(ctx);
            // 前一个值类型为可执行function 也就是next，作为参数传递给下一个函数
            mds.reduceRight((prevValue, item) => () => item(prevValue, ctx), fnWrap)();
            return ctx
        },
    };
}

/**

createOnion((ctx) => {
    console.log('核心', ctx)
})
.add((next, ctx) => {
    console.log('第一层start')
    ctx.name = '张三'
    setTimeout(next, 2000)
    console.log('第一层end')
})
.add((next, ctx) => {
    console.log('第2层start')
    ctx.age = 18
    next()
    console.log('第2层end')
})
.run({})

 */
