// 获取对象类型
function getType(obj) {
    const type = Object.prototype.toString.call(obj);
    // 坑 babel经过编译后，是没有这些东西的
    if (type === '[object GeneratorFunction]') {
        return 'GeneratorFunction';
    }
    if (type === '[object Generator]') {
        return 'Generator';
    }
    if (type === '[object Promise]') {
        return 'Promise';
    }
    if (type === '[object Function]') {
        return 'Function';
    }

    // 符合Generator规范的object
    if (typeof obj === 'object' && typeof obj.next === 'function' && obj.throw) {
        return 'Generator';
    }

    return '';
}

/**
 * [co Generator自动迭代器]
 * @param  {[Function]} generator [GeneratorFunction/Generator/Function]
 * @return {[Promise]}           [返回一个Promise]
 */
function co(generator) {
    let result = {};
    let resolve;

    function next(val) {
        // generator是否执行结束
        if (result.done) {
            return resolve(val);
        }

        // 把上面的值传给下一个
        result = generator.next(val);

        // 判断value类型，再根据类型，来觉得合适调用next
        const { value } = result;
        const type = getType(value);

        switch (type) {
            case 'Promise': {
                value
                    .then((msg) => {
                        next(msg);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                break;
            }
            case 'Function': {
                const funResult = value();
                // 如果是一个function，我们就判断其执行结果，返回的是不是一个符合Generator规范的对象
                // 如果符合，就将其当做一个Generator执行，反则当做一个正常的结果传递给next
                getType(funResult) === 'Generator'
                    ? co(funResult)
                          .then((msg) => {
                              next(msg);
                          })
                          .catch((err) => {
                              console.log(err);
                          })
                    : next(funResult);
                break;
            }
            case 'Generator': {
                co(value)
                    .then((msg) => {
                        next(msg);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                break;
            }
            case 'GeneratorFunction': {
                co(value)
                    .then((msg) => {
                        next(msg);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                break;
            }
            default: {
                next(value);
            }
        }
    }

    // 返回一个Promise
    return new Promise((res) => {
        resolve = res;

        let type = getType(generator);
        // 如果是GeneratorFunction，就先执行function
        if (type === 'GeneratorFunction' || type === 'Function') {
            generator = generator();
        }

        type = getType(generator);
        if (type !== 'Generator') {
            // 如果不是Generator就抛出一个 type error
            throw new Error('argument should be a GeneratorFunction/Generator/Function');
        }
        // 执行递归
        next();
    });
}

// 同步执行，异步任务
// function * gen() {
//     let a = yield new Promise((res, rej) => {
//         res(100)
//     })
//
//     let b = yield function() {
//         return a + 1000
//     }
//
//     let c = yield function * () {
//         let a = yield '土豆哪里去挖'
//         return a
//     }
//
//     let d = '说什么呢你'
//
//     return c + b + '哈哈哈' + d
// }
//
// co(gen).then(result => {
//     alert(result)
// })

export default co;
