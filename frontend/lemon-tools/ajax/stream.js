/**
 * 其实和中间件的处理是一样的
 * 只不过需要提供一个retry的能力
 * error/done可以抽象成一个数据的不同状态，因此也无需特殊处理
 * 需求背景
 * 对接口请求的响应做拦截，对于公共逻辑
 * 如果值满足 { code: 300 }，用户需要登录，登陆完重新请求接口
 * 对于业务
 * fetch({ url: '/get-data' })
 * 如果值满足 { code: 4002 }，重新请求接口，请求三次结束
 *
 * 嗯，如何做呢？面条代码当然可以完成逻辑，但是为了
 */

export function createX(fn, doneHandler) {
    const mds = []; // 所有中间件
    const ctx = {
        // fn和中间件通过ctx来共享一些数据
        execTime: 0,
    };
    let execMDs; // 中间件reduce之后的function
    let initJob; // 初始任务
    let isDispose = false;
    // 多少ms之后再次重试
    const retry = (time) => {
        if (time > 0) {
            setTimeout(() => {
                initJob();
            }, time);
        } else {
            initJob();
        }
    };
    const handlers = {
        done(result) {
            !isDispose && execMDs({ result, ctx, retry });
        },
        error(error) {
            !isDispose && execMDs({ error, ctx, retry });
        },
        ctx,
    };

    initJob = () => {
        if (isDispose) return;
        // 前一个值类型为可执行function 也就是next，作为参数传递给下一个函数
        // 所有数据必须通过中间件next传递给doneHandler，因此在这个过程中可以很方便的对数据进行处理
        execMDs = mds.reduceRight((prevValue, item) => item(prevValue), doneHandler);
        fn(handlers);
        ctx.execTime += 1; // 执行次数
    };

    return {
        /**
         * 添加中间件
         * @param {Array<() => () => void>} mdFns
         * @returns
         */
        add(...mdFns) {
            mds.push(...mdFns);
            return this;
        },
        dispose() {
            // 销毁 不再执行任何回调
            isDispose = true;
            return this;
        },
        run() {
            initJob();
            return this;
        },
    };
}

// 在中间件可以retry，可以takeUtil，可以preHandle修改action，或者执行retry
// 所以中间件对于next型，流式处理数据是很有帮助的，可以方便的对数据进行修改，节流
// createX(({ done, ctx }) => {
//     if (ctx.execTime > 0) {
//         done('wwwww')
//     } else {
//         done('err')
//     }
// }, action => {
//     console.log('最终结果', action)
// })
//     .add((next) => (action) => {
//         console.log('error retry enter')
//         if (action.error) {
//             action.retry()
//         } else {
//             next(action)
//         }
//         console.log('error retry leave')
//     })
//     .add((next) => (action) => {
//         console.log('debounce enter')
//         next(action)
//         console.log('debounce leave')
//     })
//     .add((next) => (action) => {
//         console.log('enter 2')
//         next(action)
//         console.log('leave 2')
//     })

// 业务调用
// const cancel = ajax({

// })
// .retry({
//     time: 2,
//     check(next) {
//         next()
//     },
// });

// 创建中间件方法
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
            // 可以添加一个next只允许被执行一次的安全保证
            mds.reduceRight((prevValue, item) => () => item(prevValue, ctx), fnWrap)();

            return ctx;
        },
    };
}

/** demo
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
}).run({})
 */
