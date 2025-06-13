/**
 * 返回唯一存在的元素
 * @param {Array<any>} arr
 * @param {Function} func
 * @returns
 */
export function unique(arr, func) {
    const u = []
    const newArr = []
    return arr.filter(item => {
        const result = func(item)
        if (u.includes(result)) {
            return false
        } else {
            newArr.push(item)
            return true
        }
    })
}

/**
 * 返回唯一存在的元素
 * @param {Array<any>} list
 * @param {(item: any) => number|string} fn
 * @returns
 */
export function pickNoRepeat(list, fn) {
    const obj = {}
    list.forEach(i => {
        const result = fn(i)
        if (obj[result]) {
            obj[result] = ''
        } else {
            obj[result] = i
        }
    })
    return Object.values(obj).filter(i => i)
}
