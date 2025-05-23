// 错误的标准，错误信息中不包含中文 /[\u4e00-\u9fa5]/

/**
 * 判断是不是js运行时错误，由js文件产生的错误
 * @param {string} msg
 * @param {string} stack
 * @param {string} filename
 * @returns {boolean}
 */
function checkIsRuntimeErr(msg, stack, filename) {
    // blob是没有的 blob:http://10.100.125.191:8081/c74b0de9-db9a-4baf-a92f-ebbe49f3ce5e:4:25
    // 没有中文，并且包含了 :// 字符串（表示包含具体的文件信息）
    return /[\u4e00-\u9fa5]/.test(msg) && /:\/\//.test(stack + filename)
}
